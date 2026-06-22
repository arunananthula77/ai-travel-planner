"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { tripAPI } from "@/utils/api";
import { Trip, User } from "@/types";
import CreateTripForm from "@/components/CreateTripForm";
import ItineraryCard from "@/components/ItineraryCard";
import PackingList from "@/components/PackingList";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"itinerary" | "hotels" | "budget" | "packing">("itinerary");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) {
      router.push("/login");
      return;
    }
    if (userData) setUser(JSON.parse(userData));
    fetchTrips();
  }, [router]);

  const fetchTrips = async () => {
    try {
      const res = await tripAPI.getAll();
      setTrips(res.data);
      if (res.data.length > 0 && !selectedTrip) {
        setSelectedTrip(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTripCreated = (newTrip: Trip) => {
    setTrips((prev) => [newTrip, ...prev]);
    setSelectedTrip(newTrip);
    setShowCreateForm(false);
    setActiveTab("itinerary");
  };

  const handleTripUpdated = (updatedTrip: Trip) => {
    setTrips((prev) => prev.map((t) => (t._id === updatedTrip._id ? updatedTrip : t)));
    setSelectedTrip(updatedTrip);
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    setDeletingId(tripId);
    try {
      await tripAPI.delete(tripId);
      const remaining = trips.filter((t) => t._id !== tripId);
      setTrips(remaining);
      setSelectedTrip(remaining.length > 0 ? remaining[0] : null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">✈️</div>
          <p className="text-slate-400 animate-pulse">Loading your travel vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className="border-b border-slate-800 px-6 py-4 sticky top-0 bg-slate-950/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">✈️</span>
            <span className="text-lg font-bold text-white">
              Trao <span className="text-blue-400">Travel</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">
              👋 {user?.name}
            </span>
            <button
              onClick={() => { setShowCreateForm(!showCreateForm); setSelectedTrip(selectedTrip); }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              + New Trip
            </button>
            <button
              onClick={handleSignOut}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-1 space-y-4">
            {/* Create Form Toggle */}
            {showCreateForm && (
              <div>
                <CreateTripForm onTripCreated={handleTripCreated} />
              </div>
            )}

            {/* Trip List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">
                Your Trips ({trips.length})
              </h2>

              {trips.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🗺️</p>
                  <p className="text-slate-500 text-sm">No trips yet.</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-3 text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Create your first trip
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {trips.map((trip) => (
                    <div
                      key={trip._id}
                      onClick={() => { setSelectedTrip(trip); setActiveTab("itinerary"); setShowCreateForm(false); }}
                      className={`w-full text-left p-3 rounded-xl border transition cursor-pointer group relative ${
                        selectedTrip?._id === trip._id
                          ? "bg-blue-600/20 border-blue-600 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <p className="font-semibold text-sm truncate pr-6">{trip.destination}</p>
                      <p className="text-xs opacity-60 mt-0.5">
                        {trip.durationDays} days · {trip.budgetTier}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip._id); }}
                        disabled={deletingId === trip._id}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition text-base leading-none"
                        title="Delete trip"
                      >
                        {deletingId === trip._id ? "..." : "×"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Budget Summary */}
            {selectedTrip && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">
                  Budget Summary
                </h2>
                <div className="space-y-2">
                  {[
                    { label: "Transport", value: selectedTrip.estimatedBudget.transport, icon: "🚌" },
                    { label: "Accommodation", value: selectedTrip.estimatedBudget.accommodation, icon: "🏨" },
                    { label: "Food", value: selectedTrip.estimatedBudget.food, icon: "🍜" },
                    { label: "Activities", value: selectedTrip.estimatedBudget.activities, icon: "🎯" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{item.icon} {item.label}</span>
                      <span className="font-semibold text-slate-200">${item.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Total</span>
                    <span className="text-base font-bold text-emerald-400">
                      ${selectedTrip.estimatedBudget.total}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3">
            {!selectedTrip ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-24 text-center">
                <span className="text-6xl mb-4">🌍</span>
                <h3 className="text-xl font-bold text-white mb-2">No trip selected</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Create your first AI-powered travel itinerary
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  ✨ Plan a Trip
                </button>
              </div>
            ) : (
              <>
                {/* Trip Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <h1 className="text-2xl font-extrabold text-white">{selectedTrip.destination}</h1>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                          📅 {selectedTrip.durationDays} days
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                          💳 {selectedTrip.budgetTier} Budget
                        </span>
                        {selectedTrip.interests.slice(0, 3).map((i) => (
                          <span key={i} className="text-xs text-indigo-300 bg-indigo-950 border border-indigo-800 px-2.5 py-1 rounded-full">
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 mt-4 border-b border-slate-800 pb-0">
                    {([
                      { key: "itinerary", label: "🗓 Itinerary" },
                      { key: "hotels", label: "🏨 Hotels" },
                      { key: "budget", label: "💰 Budget" },
                      { key: "packing", label: "🎒 Packing" },
                    ] as const).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px ${
                          activeTab === tab.key
                            ? "border-blue-500 text-blue-400"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}

                {/* ITINERARY TAB */}
                {activeTab === "itinerary" && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6">Day-by-Day Plan</h2>
                    <div className="space-y-8">
                      {selectedTrip.itinerary.map((day) => (
                        <ItineraryCard
                          key={day.dayNumber}
                          day={day}
                          tripId={selectedTrip._id}
                          destination={selectedTrip.destination}
                          budgetTier={selectedTrip.budgetTier}
                          interests={selectedTrip.interests}
                          onTripUpdated={handleTripUpdated}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* HOTELS TAB */}
                {activeTab === "hotels" && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-2">Recommended Hotels</h2>
                    <p className="text-slate-400 text-sm mb-6">
                      AI-curated hotel suggestions for {selectedTrip.destination} based on your {selectedTrip.budgetTier.toLowerCase()} budget.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTrip.hotels.map((hotel, i) => {
                        const tierColors: Record<string, string> = {
                          "Budget": "border-green-800 bg-green-950/20",
                          "Mid Range": "border-blue-800 bg-blue-950/20",
                          "Luxury": "border-amber-700 bg-amber-950/20",
                        };
                        const tierBadge: Record<string, string> = {
                          "Budget": "bg-green-900 text-green-300",
                          "Mid Range": "bg-blue-900 text-blue-300",
                          "Luxury": "bg-amber-900 text-amber-300",
                        };
                        const tierIcon: Record<string, string> = {
                          "Budget": "💚", "Mid Range": "💛", "Luxury": "💎",
                        };
                        return (
                          <div
                            key={hotel._id || i}
                            className={`border rounded-2xl p-5 ${tierColors[hotel.tier] || "border-slate-700 bg-slate-800"}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-bold text-white text-sm leading-tight">{hotel.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 ${tierBadge[hotel.tier] || "bg-slate-700 text-slate-300"}`}>
                                {tierIcon[hotel.tier]} {hotel.tier}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>⭐ {hotel.rating}</span>
                              <span className="font-semibold text-white">
                                ${hotel.estimatedCostNightUSD}<span className="text-slate-500 font-normal">/night</span>
                              </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-700/50">
                              <p className="text-xs text-slate-500">
                                Est. total: <span className="text-slate-300 font-semibold">
                                  ${hotel.estimatedCostNightUSD * selectedTrip.durationDays}
                                </span> for {selectedTrip.durationDays} nights
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* BUDGET TAB */}
                {activeTab === "budget" && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-2">Budget Breakdown</h2>
                    <p className="text-slate-400 text-sm mb-6">
                      Estimated costs for your {selectedTrip.durationDays}-day trip to {selectedTrip.destination}.
                    </p>
                    <div className="space-y-4 mb-8">
                      {[
                        { label: "Flights & Transport", value: selectedTrip.estimatedBudget.transport, icon: "✈️", color: "bg-blue-500" },
                        { label: "Accommodation", value: selectedTrip.estimatedBudget.accommodation, icon: "🏨", color: "bg-purple-500" },
                        { label: "Food & Dining", value: selectedTrip.estimatedBudget.food, icon: "🍜", color: "bg-amber-500" },
                        { label: "Activities & Sightseeing", value: selectedTrip.estimatedBudget.activities, icon: "🎯", color: "bg-emerald-500" },
                      ].map((item) => {
                        const pct = selectedTrip.estimatedBudget.total > 0
                          ? Math.round((item.value / selectedTrip.estimatedBudget.total) * 100)
                          : 0;
                        return (
                          <div key={item.label}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-sm text-slate-300">{item.icon} {item.label}</span>
                              <span className="text-sm font-bold text-white">${item.value} <span className="text-slate-500 font-normal text-xs">({pct}%)</span></span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                              <div
                                className={`${item.color} h-2 rounded-full transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Total Estimated Budget</p>
                        <p className="text-3xl font-extrabold text-white mt-0.5">
                          ${selectedTrip.estimatedBudget.total}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs">Per day average</p>
                        <p className="text-xl font-bold text-emerald-400 mt-0.5">
                          ${Math.round(selectedTrip.estimatedBudget.total / selectedTrip.durationDays)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PACKING TAB */}
                {activeTab === "packing" && (
                  <PackingList
                    packingList={selectedTrip.packingList}
                    tripId={selectedTrip._id}
                    onTripUpdated={handleTripUpdated}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
