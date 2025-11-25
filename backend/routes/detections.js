const express = require('express');
const router = express.Router();
const Detection = require('../models/Detection');

// Get all detections
router.get('/', async (req, res) => {
  try {
    const detections = await Detection.find().sort({ timestamp: -1 }).limit(50);
    res.json(detections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get detection by ID
router.get('/:id', async (req, res) => {
  try {
    const detection = await Detection.findById(req.params.id);
    if (!detection) {
      return res.status(404).json({ message: 'Detection not found' });
    }
    res.json(detection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new detection
router.post('/', async (req, res) => {
  const detection = new Detection({
    imageUrl: req.body.imageUrl,
    peopleCount: req.body.peopleCount,
    detections: req.body.detections,
    avgConfidence: req.body.avgConfidence
  });

  try {
    const newDetection = await detection.save();
    res.status(201).json(newDetection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete detection
router.delete('/:id', async (req, res) => {
  try {
    const detection = await Detection.findById(req.params.id);
    if (!detection) {
      return res.status(404).json({ message: 'Detection not found' });
    }
    await detection.deleteOne();
    res.json({ message: 'Detection deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalDetections = await Detection.countDocuments();
    const avgPeople = await Detection.aggregate([
      { $group: { _id: null, avgCount: { $avg: '$peopleCount' } } }
    ]);
    
    res.json({
      totalDetections,
      avgPeoplePerDetection: avgPeople[0]?.avgCount || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;