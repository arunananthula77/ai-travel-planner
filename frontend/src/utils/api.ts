import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

export const tripAPI = {
  getAll: () => api.get("/trips"),
  getById: (id: string) => api.get(`/trips/${id}`),
  generate: (data: {
    destination: string;
    durationDays: number;
    budgetTier: string;
    interests: string[];
  }) => api.post("/trips/generate", data),
  update: (id: string, data: object) => api.put(`/trips/${id}`, data),
  delete: (id: string) => api.delete(`/trips/${id}`),
  regenerateDay: (id: string, dayNumber: number, feedback: string) =>
    api.post(`/trips/${id}/regenerate-day`, { dayNumber, feedback }),
  addActivity: (
    id: string,
    dayNumber: number,
    activity: { title: string; description?: string; timeOfDay?: string }
  ) => api.post(`/trips/${id}/activity`, { dayNumber, activity }),
  removeActivity: (id: string, dayNumber: number, activityId: string) =>
    api.delete(`/trips/${id}/activity`, { data: { dayNumber, activityId } }),
};

export default api;
