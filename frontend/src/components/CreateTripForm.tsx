"use client";
import { useState } from "react";
import { tripAPI } from "@/utils/api";
import { Trip, TripFormData } from "@/types";

const INTEREST_OPTIONS = [
  "Food & Dining", "Culture & History", "Adventure & Hiking",
  "Shopping", "Art & Museums", "Nature & Wildlife",
  "Nightlife", "Beaches & Water Sports", "Photography", "Wellness & Spa",
];

interface Props {
  onTripCreated: (trip: Trip) => void;
}

export default function CreateTripForm({ onTripCreated }: Props) {
  const [form, setForm] = useState<TripFormData>({
    destination: "",
    durationDays: 5,
    budgetTier: "Medium",
    interests: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destination.trim()) return setError("Please enter a destination");
    if (form.interests.length === 0) return setError("Please select at least one interest");
    setLoading(true);
    setError("");

    try {
      const res = await tripAPI.generate(form);
      onTripCreated(res.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to generate trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">Plan a New Trip</h2>
      <p className="text-slate-400 text-sm mb-6">Fill in your preferences and let AI do the rest.</p>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            🌍 Destination
          </label>
          <input
            type="text"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            placeholder="e.g., Tokyo, Japan"
            className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            📅 Duration: <span className="text-blue-400 font-bold">{form.durationDays} days</span>
          </label>
          <input
            type="range"
            min={1}
            max={14}
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) })}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1 day</span><span>14 days</span>
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">💳 Budget Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(["Low", "Medium", "High"] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setForm({ ...form, budgetTier: tier })}
                className={`py-2.5 rounded-lg text-sm font-semibold border transition ${
                  form.budgetTier === tier
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                {tier === "Low" ? "💚 Low" : tier === "Medium" ? "💛 Medium" : "💎 High"}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            🎯 Interests <span className="text-slate-500">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  form.interests.includes(interest)
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating your itinerary...
            </>
          ) : (
            "✨ Generate Trip with AI"
          )}
        </button>
      </form>
    </div>
  );
}
