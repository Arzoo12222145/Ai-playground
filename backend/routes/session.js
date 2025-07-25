const express = require('express');
const Session = require('../models/Session');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all sessions for a user
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.userId });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: err.message });
  }
});

// Create a new session
router.post('/', auth, async (req, res) => {
  try {
    const session = new Session({ ...req.body, userId: req.user.userId });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create session', error: err.message });
  }
});

// Get a specific session
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch session', error: err.message });
  }
});

// Update a session
router.put('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update session', error: err.message });
  }
});

// Delete a session
router.delete('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete session', error: err.message });
  }
});

module.exports = router; 