import express from 'express';
import { connectToDatabase } from '../db.js';
import { getUsers, authMiddleware } from '../middleware.js';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const router = express.Router();
const db = await connectToDatabase();
const usersCollection = db.collection('users');

router.get('/account', authMiddleware, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.authorised_user.id) });

    if (!user) return res.status(404).json({ error: "User not found" });

    const escapedRooms = await Promise.all(
      (user.escapedRooms || []).map(async ({ escapeRoomId, firstTime, fastestTime }) => {
        const room = await db.collection("escape_rooms").findOne({ _id: escapeRoomId });
        return {
          _id: room._id,
          title: room.title,
          firstTime,
          fastestTime
        };
      })
    );

    res.json({ username: user.username, escapedRooms });
  } catch (error) {
    console.error("Error fetching account data:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/:id', getUsers, async (req, res) => {
    try {
        const user = await usersCollection.findOne({ _id: req.params.id });
        if (!user) return res.status(404).json({ error: "Korisnik nije pronađen" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Greška tijekom dohvaćanja korisnika" });
    }
});

export default router;
