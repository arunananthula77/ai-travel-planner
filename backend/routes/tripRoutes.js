const express = require('express');
const router = express.Router();
const {
  generateTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  regenerateDay,
  addActivity,
  removeActivity,
} = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

// All trip routes are protected
router.use(protect);

router.post('/generate', generateTrip);
router.get('/', getUserTrips);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.post('/:id/regenerate-day', regenerateDay);
router.post('/:id/activity', addActivity);
router.delete('/:id/activity', removeActivity);

module.exports = router;
