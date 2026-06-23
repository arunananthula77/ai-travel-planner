const Trip = require("../models/Trip");

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Gemini Error " + response.status + ": " + err);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

exports.getUserTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve trips" });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve trip" });
  }
};

exports.generateNewTrip = async (req, res) => {
  const { destination, durationDays, budgetTier, interests } = req.body;
  const userId = req.user.id;

  if (!destination || !durationDays || !budgetTier || !interests) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const prompt = `You are an expert travel planner. Create a ${durationDays}-day trip to ${destination}. Budget: ${budgetTier}. Interests: ${interests.join(", ")}.
Respond ONLY with valid JSON, no markdown, no explanation:
{"itinerary":[{"dayNumber":1,"activities":[{"title":"Activity name","description":"2 sentence description","estimatedCostUSD":20,"timeOfDay":"Morning"}]}],"hotels":[{"name":"Budget Hotel","tier":"Budget","estimatedCostNightUSD":60,"rating":"4.0/5"},{"name":"Mid Hotel","tier":"Mid Range","estimatedCostNightUSD":120,"rating":"4.5/5"},{"name":"Luxury Hotel","tier":"Luxury","estimatedCostNightUSD":280,"rating":"4.8/5"}],"estimatedBudget":{"transport":200,"accommodation":300,"food":150,"activities":120,"total":770},"packingList":[{"item":"Passport","category":"Documents","isPacked":false},{"item":"Comfortable shoes","category":"Clothing","isPacked":false},{"item":"Sunscreen","category":"Gear","isPacked":false},{"item":"Camera","category":"Gear","isPacked":false}]}
Include exactly ${durationDays} days with 3 activities each spread across Morning, Afternoon, Evening.`;

  try {
    const text = await callGemini(prompt);
    const clean = text.replace(/```json|```/g, "").trim();
    const aiResult = JSON.parse(clean);

    const newTrip = new Trip({
      userId, destination,
      durationDays: parseInt(durationDays),
      budgetTier, interests,
      itinerary: aiResult.itinerary || [],
      hotels: aiResult.hotels || [],
      estimatedBudget: aiResult.estimatedBudget || {},
      packingList: aiResult.packingList || []
    });

    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    console.error("AI Generation Error:", error.message);
    res.status(500).json({ message: "Failed to generate trip.", error: error.message });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const fields = ["itinerary", "packingList", "destination", "durationDays", "budgetTier", "interests"];
    fields.forEach(f => { if (req.body[f] !== undefined) trip[f] = req.body[f]; });
    const updated = await trip.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update trip" });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.status(200).json({ message: "Trip deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete trip" });
  }
};

exports.regenerateDay = async (req, res) => {
  const { dayNumber, feedback } = req.body;
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const prompt = `Regenerate Day ${dayNumber} for ${trip.destination}. Feedback: "${feedback || "Fresh activities"}". Respond ONLY with JSON: {"dayNumber":${dayNumber},"activities":[{"title":"Activity","description":"Details","estimatedCostUSD":20,"timeOfDay":"Morning"}]}`;
    const text = await callGemini(prompt);
    const clean = text.replace(/```json|```/g, "").trim();
    const newDay = JSON.parse(clean);
    trip.itinerary = trip.itinerary.map(d => d.dayNumber === parseInt(dayNumber) ? newDay : d);
    const updated = await trip.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to regenerate day" });
  }
};

exports.addActivity = async (req, res) => {
  const { dayNumber, activity } = req.body;
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const dayIndex = trip.itinerary.findIndex(d => d.dayNumber === parseInt(dayNumber));
    if (dayIndex === -1) return res.status(404).json({ message: "Day not found" });
    trip.itinerary[dayIndex].activities.push({ title: activity.title, description: activity.description || "Custom activity", estimatedCostUSD: 0, timeOfDay: activity.timeOfDay || "Afternoon" });
    const updated = await trip.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to add activity" });
  }
};

exports.removeActivity = async (req, res) => {
  const { dayNumber, activityId } = req.body;
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const dayIndex = trip.itinerary.findIndex(d => d.dayNumber === parseInt(dayNumber));
    if (dayIndex === -1) return res.status(404).json({ message: "Day not found" });
    trip.itinerary[dayIndex].activities = trip.itinerary[dayIndex].activities.filter(a => a._id.toString() !== activityId);
    const updated = await trip.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to remove activity" });
  }
};
