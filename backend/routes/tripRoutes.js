const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  getUserTrips,
  getTripById,
  generateNewTrip,
  updateTrip,
  regenerateDay,
  deleteTrip,
  addActivity,
  removeActivity
} = require("../controllers/tripController");

router.use(protect);

router.get("/", getUserTrips);
router.post("/generate", generateNewTrip);
router.get("/:id", getTripById);
router.put("/:id", updateTrip);
router.delete("/:id", deleteTrip);
router.post("/:id/regenerate-day", regenerateDay);
router.post("/:id/activity", addActivity);
router.delete("/:id/activity", removeActivity);

module.exports = router;
