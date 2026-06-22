import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">
            ✈️
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Trao</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
          Plan your trip with
          <span className="block bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            AI in seconds
          </span>
        </h1>

        <p className="text-xl text-slate-400 mb-10 leading-relaxed">
          Tell us where you want to go. Our AI builds a complete day-by-day itinerary,
          estimates your budget, suggests hotels, and even packs your bag.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-105"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all duration-200"
          >
            Sign In
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            { icon: '🗺️', title: 'AI Itinerary', desc: 'Day-by-day plans tailored to your interests and budget' },
            { icon: '💰', title: 'Budget Estimate', desc: 'Realistic cost breakdowns for flights, hotels, food & activities' },
            { icon: '🎒', title: 'Smart Packing', desc: 'Weather-aware packing list based on your destination' },
          ].map((f) => (
            <div key={f.title} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
