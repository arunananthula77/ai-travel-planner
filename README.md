# ✈️ Trao AI Travel Planner

A full-stack, multi-user AI-powered travel itinerary web application built for the **Trao Full Stack Engineering Assessment**.

---

## 🔗 Live Demo

- **Frontend (Vercel):** `https://your-app.vercel.app`
- **Backend (Render):** `https://your-api.onrender.com`

---

## 📌 Project Overview

Users can register, log in, and generate complete AI-powered travel itineraries simply by providing a destination, trip duration, budget preference, and personal interests. The AI (Google Gemini) returns a structured day-by-day plan, budget breakdown, hotel suggestions, and a smart packing checklist — all editable and saved securely per user.

---

## 🛠 Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR capability, file-based routing, production-grade React |
| Styling | Tailwind CSS | Rapid UI development, fully responsive, no runtime overhead |
| Backend | Node.js + Express.js | Lightweight, fast, large ecosystem, matches preferred stack |
| Database | MongoDB + Mongoose ODM | Flexible schema suits dynamic itinerary structures |
| Auth | JWT + bcryptjs | Stateless, scalable authentication; passwords hashed with salt rounds |
| AI Agent | Google Gemini 2.0 Flash API | Fast, accurate JSON-structured responses, generous free tier |
| Deployment | Vercel (frontend) + Render (backend) | Industry-standard, simple CI/CD from GitHub |

---

## 🏗 High-Level Architecture

```
Next.js Client (Browser)
       │
       │  REST API + JWT Bearer Token
       ▼
Express.js Server (Node.js)
       │
       ├── Auth Middleware (JWT verify → req.user)
       ├── Auth Routes  → MongoDB Users collection
       ├── Trip Routes  → MongoDB Trips collection
       │                → Google Gemini API (AI generation)
       └── Error Handler
```

All trip data is scoped strictly to `userId` — no user can access another's data.

---

## 🔐 Authentication & Authorization

- **Registration:** Password hashed with `bcryptjs` (12 salt rounds) before storage
- **Login:** `bcrypt.compare()` validates credentials; signed JWT returned (7-day expiry)
- **Protected Routes:** All `/api/trips/*` routes pass through `auth.js` middleware
- **Data Isolation:** Every MongoDB query filters by `userId: req.user.id` — enforced server-side
- **Frontend Guard:** Dashboard redirects to `/login` if no token found in `localStorage`

---

## 🤖 AI Agent Design

**Model:** Google Gemini 2.0 Flash (`gemini-2.0-flash`)

**Strategy:** Structured JSON prompting — the prompt explicitly defines the required output schema, constraining Gemini to return only valid JSON matching the `Trip` database model.

**Resilience:** Exponential backoff retry (up to 5 attempts: 1s → 2s → 4s → 8s → 16s) handles transient API rate limits.

**Operations:**
1. `POST /api/trips/generate` — Full itinerary, budget, hotels, packing list in one call
2. `POST /api/trips/:id/regenerate-day` — Targeted single-day regeneration with user feedback

---

## 🎒 Creative Custom Feature: AI Weather-Aware Packing Assistant

**Problem it solves:** Travelers often forget destination-specific items — whether it's rain gear for a monsoon city, hiking boots for a mountain trek, or sunscreen for a beach holiday.

**How it works:**
- The Gemini prompt is aware of both the **destination** and the **interests** (e.g., "Hiking, Culture")
- It generates a categorized packing checklist split into: `Documents`, `Clothing`, `Gear`, and `Other`
- Items are climate-appropriate (e.g., umbrella for rainy destinations) and activity-specific (e.g., hiking boots if hiking is an interest)
- Each item is a **persistent checkbox** — toggling updates the database instantly
- A visual progress bar tracks packing completion

**Engineering judgment:** Rather than using a separate weather API (which would require an extra key and API call), the LLM itself reasons about the destination's typical climate during the generation step — making it zero additional cost and latency.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier)
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### Local Development

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/ai-travel-planner.git
cd ai-travel-planner
```

**2. Backend setup**
```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGO_URI, JWT_SECRET, GEMINI_API_KEY in .env
npm run dev
# Runs on http://localhost:5000
```

**3. Frontend setup**
```bash
cd ../frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
# Runs on http://localhost:3000
```

---

## 🚀 Deployment

### Backend → Render
1. Push code to GitHub
2. Create a new **Web Service** on Render pointing to `/backend`
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLIENT_URL`, `PORT`

### Frontend → Vercel
1. Import the GitHub repository on Vercel
2. Set **Root Directory** to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
4. Deploy

---

## 🔑 Key Design Decisions & Trade-offs

| Decision | Reasoning | Trade-off |
|----------|-----------|-----------|
| Monorepo (single repo, two folders) | Easier to manage, single GitHub link for submission | Slightly more complex Vercel/Render root directory config |
| JWT in localStorage | Simple client implementation | Less secure than httpOnly cookies; acceptable for this assessment scope |
| Single Gemini call for full trip | Faster UX, fewer API calls | Less granular control vs. separate calls per section |
| Exponential backoff | Resilience against rate limits | Adds latency on failure scenarios |
| Client-side tab navigation | Zero page loads between itinerary/hotels/budget/packing | All data must be loaded upfront |

---

## ⚠️ Known Limitations

- No real-time weather API integration — climate inference is AI-based (may not reflect current season)
- JWT stored in localStorage (not httpOnly cookie) — acceptable for assessment, not for high-security production
- No image search for hotels — names and ratings are AI-generated estimates
- Gemini free tier has rate limits — heavy concurrent usage may trigger retries

---

## 📁 Project Structure

```
ai-travel-planner/
├── backend/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/{User,Trip}.js
│   ├── controllers/{authController,tripController}.js
│   ├── routes/{authRoutes,tripRoutes}.js
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/{page,layout,dashboard,login,register}/
    │   ├── components/{CreateTripForm,ItineraryCard,PackingList}.tsx
    │   ├── utils/api.ts
    │   └── types/index.ts
    ├── tailwind.config.js
    └── package.json
```
