"use client";
import { useState } from "react";
import { ItineraryDay, Trip } from "@/types";
import { tripAPI } from "@/utils/api";

interface Props {
  day: ItineraryDay;
  tripId: string;
  destination: string;
  budgetTier: string;
  interests: string[];
  onTripUpdated: (trip: Trip) => void;
}

const TIME_COLORS: Record<string, string> = {
  Morning: "bg-amber-900/40 text-amber-300",
  Afternoon: "bg-blue-900/40 text-blue-300",
  Evening: "bg-purple-900/40 text-purple-300",
};

export default function ItineraryCard({ day, tripId, destination, budgetTier, interests, onTripUpdated }: Props) {
  const [newActivity, setNewActivity] = useState("");
  const [regenerateFeedback, setRegenerateFeedback] = useState("");
  const [showRegenInput, setShowRegenInput] = useState(false);
  const [addingActivity, setAddingActivity] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;
    setAddingActivity(true);
    try {
      const res = await tripAPI.addActivity(tripId, day.dayNumber, {
        title: newActivity,
        description: "Custom activity added by traveler",
        timeOfDay: "Afternoon",
      });
      onTripUpdated(res.data);
      setNewActivity("");
    } catch (err) {
      console.error("Add activity failed:", err);
    } finally {
      setAddingActivity(false);
    }
  };

  const handleRemoveActivity = async (activityId: string) => {
    try {
      const res = await tripAPI.removeActivity(tripId, day.dayNumber, activityId);
      onTripUpdated(res.data);
    } catch (err) {
      console.error("Remove activity failed:", err);
    }
  };

  const handleRegenerateDay = async () => {
    setRegenerating(true);
    try {
      const feedback = regenerateFeedback || `Regenerate Day ${day.dayNumber} with fresh activities`;
      const res = await tripAPI.regenerateDay(tripId, day.dayNumber, feedback);
      onTripUpdated(res.data);
      setRegenerateFeedback("");
      setShowRegenInput(false);
    } catch (err) {
      console.error("Regenerate day failed:", err);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="border-l-2 border-indigo-500 pl-6 relative pb-2">
      <div className="absolute -left-[9px] top-1 w-4 h-4 bg-indigo-500 rounded-full border-4 border-slate-950" />

      {/* Day Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-slate-200">Day {day.dayNumber}</h3>
        <button
          onClick={() => setShowRegenInput(!showRegenInput)}
          className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800 hover:border-indigo-600 px-2.5 py-1 rounded-lg transition"
        >
          ↺ Regenerate
        </button>
      </div>

      {/* Regenerate Input */}
      {showRegenInput && (
        <div className="mb-4 bg-slate-800 rounded-xl p-3 border border-indigo-800">
          <p className="text-xs text-slate-400 mb-2">Describe what you want for this day:</p>
          <textarea
            value={regenerateFeedback}
            onChange={(e) => setRegenerateFeedback(e.target.value)}
            placeholder={`e.g., "More outdoor activities near the coast"`}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleRegenerateDay}
              disabled={regenerating}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              {regenerating ? "Regenerating..." : "✨ Regenerate Day"}
            </button>
            <button
              onClick={() => setShowRegenInput(false)}
              className="text-slate-400 hover:text-white text-xs px-3 py-1.5 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Activities */}
      <div className="space-y-2 mb-4">
        {day.activities.map((act, index) => (
          <div key={act._id || index} className="bg-slate-800 border border-slate-700 rounded-xl p-3 group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm">{act.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TIME_COLORS[act.timeOfDay] || "bg-slate-700 text-slate-300"}`}>
                    {act.timeOfDay}
                  </span>
                  {act.estimatedCostUSD > 0 && (
                    <span className="text-[10px] text-emerald-400">${act.estimatedCostUSD}</span>
                  )}
                </div>
                {act.description && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{act.description}</p>
                )}
              </div>
              {act._id && (
                <button
                  onClick={() => handleRemoveActivity(act._id!)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition text-lg leading-none flex-shrink-0"
                  title="Remove activity"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Activity */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newActivity}
          onChange={(e) => setNewActivity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
          placeholder="Add a custom activity..."
          className="flex-1 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition"
        />
        <button
          onClick={handleAddActivity}
          disabled={addingActivity || !newActivity.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
        >
          {addingActivity ? "..." : "+ Add"}
        </button>
      </div>
    </div>
  );
}
