"use client";
import { PackingItem, Trip } from "@/types";
import { tripAPI } from "@/utils/api";

interface Props {
  packingList: PackingItem[];
  tripId: string;
  onTripUpdated: (trip: Trip) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Documents: "📄",
  Clothing: "👕",
  Gear: "🎒",
  Other: "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
  Documents: "bg-blue-900/30 text-blue-300 border-blue-800",
  Clothing: "bg-purple-900/30 text-purple-300 border-purple-800",
  Gear: "bg-amber-900/30 text-amber-300 border-amber-800",
  Other: "bg-slate-800 text-slate-300 border-slate-700",
};

export default function PackingList({ packingList, tripId, onTripUpdated }: Props) {
  const handleToggle = async (itemId: string) => {
    const updatedList = packingList.map((item) =>
      item._id === itemId ? { ...item, isPacked: !item.isPacked } : item
    );
    try {
      const res = await tripAPI.update(tripId, { packingList: updatedList });
      onTripUpdated(res.data);
    } catch (err) {
      console.error("Toggle packing item failed:", err);
    }
  };

  const packedCount = packingList.filter((i) => i.isPacked).length;
  const totalCount = packingList.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  const grouped = packingList.reduce<Record<string, PackingItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            ⛈️ AI Weather-Aware Packing Assistant
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Smart checklist tailored to your destination climate and planned activities
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-bold text-emerald-400">{packedCount}</span>
          <span className="text-slate-500 text-sm">/{totalCount}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Grouped Categories */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
              <span>{CATEGORY_ICONS[category]}</span>
              {category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {items.map((item) => (
                <div
                  key={item._id}
                  onClick={() => item._id && handleToggle(item._id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    item.isPacked
                      ? "bg-emerald-950/30 border-emerald-900"
                      : "bg-slate-800 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                      item.isPacked
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-500"
                    }`}
                  >
                    {item.isPacked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${item.isPacked ? "line-through text-slate-500" : "text-slate-200"}`}>
                    {item.item}
                  </span>
                  <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[item.category]}`}>
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {progress === 100 && (
        <div className="mt-5 bg-emerald-950 border border-emerald-800 rounded-xl p-3 text-center">
          <p className="text-emerald-300 text-sm font-semibold">🎉 All packed! Have a great trip!</p>
        </div>
      )}
    </div>
  );
}
