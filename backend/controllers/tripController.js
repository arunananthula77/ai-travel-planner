const Trip = require("../models/Trip");

// Exponential backoff retry for Gemini API resilience
async function fetchWithRetry(url, options, retries = 3, delay = 60000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        console.log(`Rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      const errText = await response.text();
      throw new Error(`Gemini API Error ${response.status}: ${errText}`);
    }
    return await response.json();
  } catch (error) {
    if (retries > 0 && !error.message?.includes("Gemini API Error")) {
      console.log(`Request failed. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Try primary model, fall back to gemini-1.5-flash if rate limited
async function callGeminiWithFallback(apiKey, payload) {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash-latest"];
  let lastError;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.log(`Trying model: ${model}`);
      const data = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, 2, 65000);
      return data;
    } catch (error) {
      console.log(`Model ${model} failed: ${error.message}`);
      lastError = error;
    }
  }
  throw lastError;
}

function buildItineraryPrompt(destination, durationDays, budgetTier, interests) {
  return `You are an expert travel planner AI. Create a detailed ${durationDays}-day travel itinerary for ${destination}.
Budget level: ${budgetTier}. Traveler interests: ${interests.join(", ")}.

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no code blocks, no explanation — just raw JSON.

Required JSON structure:
{
  "itinerary": [
    {
      "dayNumber": 1,
      "activities": [
        {
          "title": "Activity name",
          "description": "2-3 sentence description of this activity",
          "estimatedCostUSD": 25,
          "timeOfDay": "Morning"
        }
      ]
    }
  ],
  "hotels": [
    {
      "name": "Hotel name",
      "tier": "Budget",
      "estimatedCostNightUSD": 60,
      "rating": "4.2/5"
    },
    {
      "name": "Hotel name",
      "tier": "Mid Range",
      "estimatedCostNightUSD": 120,
      "rating": "4.5/5"
    },
    {
      "name": "Hotel name",
      "tier": "Luxury",
      "estimatedCostNightUSD": 280,
      "rating": "4.8/5"
    }
  ],
  "estimatedBudget": {
    "transport": 200,
    "accommodation": 300,
    "food": 150,
    "activities": 120,
    "total": 770
  },
  "packingList": [
    { "item": "Passport", "category": "Documents", "isPacked": false },
    { "item": "Travel insurance documents", "category": "Documents", "isPacked": false },
    { "item": "Comfortable walking shoes", "category": "Clothing", "isPacked": false },
    { "item": "Weather-appropriate outfits (x${durationDays})", "category": "Clothing", "isPacked": false },
    { "item": "Sunscreen SPF 50", "category": "Gear", "isPacked": false },
    { "item": "Portable charger / power bank", "category": "Gear", "isPacked": false },
    { "item": "Camera or phone mount", "category": "Gear", "isPacked": false }
  ]
}

Rules:
- Include exactly ${durationDays} days in the itinerary
- Each day should have 3-4 activities spread across Morning, Afternoon, and Evening
- Budget estimates must be realistic for ${destination} at ${budgetTier} budget level
- Packing list should have 12-18 items relevant to ${destination} climate and ${interests.join(", ")} activities
- Hotel costs must reflect the ${budgetTier} preference appropriately`;
}

function buildRegenerateDayPrompt(destination, dayNumber, durationDays, budgetTier, interests, userFeedback) {
  return `You are an expert travel planner AI. Regenerate Day ${dayNumber} of a ${durationDays}-day trip to ${destination}.
Budget: ${budgetTier}. Interests: ${interests.join(", ")}.
User feedback: "${userFeedback}"

Respond ONLY with a valid JSON object for a single day. No markdown or explanation.

Required structure:
{
  "dayNumber": ${dayNumber},
  "activities": [
    {
      "title": "Activity name",
      "description": "2-3 sentence description",
      "estimatedCostUSD": 30,
      "timeOfDay": "Morning"
    }
  ]
}

Include 3-4 activities that address the user feedback. Spread across Morning, Afternoon, and Evening.`;
}

// GET /api/trips — fetch all trips for authenticated user
exports.getUserTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    console.error("Get trips error:", error);
    res.status(500).json({ message: "Failed to retrieve trips" });
  }
};

// GET /api/trips/:id — get single trip (owner only)
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found or access denied" });
    }
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve trip" });
  }
};

// POST /api/trips/generate — generate new trip with Gemini AI
exports.generateNewTrip = async (req, res) => {
  const { destination, durationDays, budgetTier, interests } = req.body;
  const userId = req.user.id;

  if (!destination || !durationDays || !budgetTier || !interests) {
    return res.status(400).json({ message: "All trip fields are required" });
  }

  const prompt = buildItineraryPrompt(destination, durationDays, budgetTier, interests);

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    const requestPayload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    };

    const data = await callGeminiWithFallback(apiKey, requestPayload);

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Empty response from Gemini API");
    }

    const cleanText = rawText.replace(/```json|```/g, "").trim();
    const aiResult = JSON.parse(cleanText);

    const newTrip = new Trip({
      userId,
      destination,
      durationDays: parseInt(durationDays),
      budgetTier,
      interests,
      itinerary: aiResult.itinerary || [],
      hotels: aiResult.hotels || [],
      estimatedBudget: aiResult.estimatedBudget || {},
      packingList: aiResult.packingList || []
    });

    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ message: "Failed to generate trip. Please try again.", error: error.message });
  }
};

// PUT /api/trips/:id — update itinerary / packing list
exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found or access denied" });
    }

    const allowedFields = ["itinerary", "packingList", "destination", "durationDays", "budgetTier", "interests"];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        trip[field] = req.body[field];
      }
    });

    const updated = await trip.save();
    res.status(200).json(updated);
  } catch (error) {
    console.error("Update trip error:", error);
    res.status(500).json({ message: "Failed to update trip" });
  }
};

// POST /api/trips/:id/regenerate-day — regenerate a specific day
exports.regenerateDay = async (req, res) => {
  const { dayNumber, feedback } = req.body;

  if (!dayNumber) {
    return res.status(400).json({ message: "dayNumber is required" });
  }

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found or access denied" });
    }

    const prompt = buildRegenerateDayPrompt(
      trip.destination,
      dayNumber,
      trip.durationDays,
      trip.budgetTier,
      trip.interests,
      feedback || `Regenerate Day ${dayNumber} with fresh activities`
    );

    const apiKey = process.env.GEMINI_API_KEY;

    const data = await callGeminiWithFallback(apiKey, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.8 }
    });

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Empty response from Gemini API");

    const cleanText = rawText.replace(/```json|```/g, "").trim();
    const newDay = JSON.parse(cleanText);

    trip.itinerary = trip.itinerary.map(day =>
      day.dayNumber === parseInt(dayNumber) ? newDay : day
    );

    const updated = await trip.save();
    res.status(200).json(updated);

  } catch (error) {
    console.error("Regenerate day error:", error);
    res.status(500).json({ message: "Failed to regenerate day. Please try again." });
  }
};

// DELETE /api/trips/:id — delete a trip
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found or access denied" });
    }
    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete trip" });
  }
};

// POST /api/trips/:id/activity — add activity to specific day
exports.addActivity = async (req, res) => {
  const { dayNumber, activity } = req.body;

  if (!dayNumber || !activity?.title) {
    return res.status(400).json({ message: "dayNumber and activity title are required" });
  }

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found or access denied" });
    }

    const dayIndex = trip.itinerary.findIndex(d => d.dayNumber === parseInt(dayNumber));
    if (dayIndex === -1) {
      return res.status(404).json({ message: "Day not found in itinerary" });
    }

    trip.itinerary[dayIndex].activities.push({
      title: activity.title,
      description: activity.description || "Custom activity added by traveler",
      estimatedCostUSD: activity.estimatedCostUSD || 0,
      timeOfDay: activity.timeOfDay || "Afternoon"
    });

    const updated = await trip.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to add activity" });
  }
};

// DELETE /api/trips/:id/activity — remove activity from specific day
exports.removeActivity = async (req, res) => {
  const { dayNumber, activityId } = req.body;

  if (!dayNumber || !activityId) {
    return res.status(400).json({ message: "dayNumber and activityId are required" });
  }

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found or access denied" });
    }

    const dayIndex = trip.itinerary.findIndex(d => d.dayNumber === parseInt(dayNumber));
    if (dayIndex === -1) {
      return res.status(404).json({ message: "Day not found" });
    }

    trip.itinerary[dayIndex].activities = trip.itinerary[dayIndex].activities.filter(
      a => a._id.toString() !== activityId
    );

    const updated = await trip.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to remove activity" });
  }
};
