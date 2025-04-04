import express from 'express';
import { connectToDatabase } from '../db.js';
import { getUsers } from '../middleware.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const db = await connectToDatabase();
const usersCollection = db.collection('users');

router.get('/:id', getUsers, async (req, res) => {
    try {
        const user = await usersCollection.findOne({ _id: req.params.id });
        if (!user) return res.status(404).json({ error: "Korisnik nije pronađen" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Greška tijekom dohvaćanja korisnika" });
    }
});

router.put('/:id/fastest-time', async (req, res) => {
    const { escapeRoomId, newTime } = req.body;

    if (!escapeRoomId || !newTime) {
        return res.status(400).json({ error: "Nedostaju podaci" });
    }

    try {
        const user = await usersCollection.findOne({ _id: req.params.id });
        if (!user) return res.status(404).json({ error: "Korisnik nije pronađen" });

        let updatedUser = await usersCollection.findOneAndUpdate(
            { _id: req.params.id, "fastestTimes.escapeRoomId": escapeRoomId },
            { $min: { "fastestTimes.$.time": newTime } }, 
            { returnDocument: "after" }
        );

        
        if (!updatedUser.value) {
            updatedUser = await usersCollection.findOneAndUpdate(
                { _id: req.params.id },
                { $push: { fastestTimes: { escapeRoomId, time: newTime } } },
                { returnDocument: "after" }
            );
        }

        res.json(updatedUser.value);
    } catch (error) {
        res.status(500).json({ error: "Greška pri ažuriranju vremena" });
    }
});


router.post('/:id/first-time', async (req, res) => {
    const { escapeRoomId, firstTime } = req.body;

    if (!escapeRoomId || !firstTime) {
        return res.status(400).json({ error: "Nedostaju podaci" });
    }

    try {
        const user = await usersCollection.findOne({ _id: req.params.id });
        if (!user) return res.status(404).json({ error: "Korisnik nije pronađen" });

        const alreadyPlayed = user.completedRooms?.some(room => room.escapeRoomId === escapeRoomId);
        if (alreadyPlayed) {
            return res.status(400).json({ error: "Prvo vrijeme je već postavljeno" });
        }

        const updatedUser = await usersCollection.findOneAndUpdate(
            { _id: req.params.id },
            { $push: { completedRooms: { escapeRoomId, firstTime } } },
            { returnDocument: "after" }
        );

        res.json(updatedUser.value);
    } catch (error) {
        res.status(500).json({ error: "Greška pri spremanju prvog vremena" });
    }
});

router.get('/account', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Unauthorized" });
  
      const decoded = jwt.verify(token, "your_secret_key");
      const db = await connectToDatabase();
      const user = await db.collection("users").findOne({ _id: decoded.userId });
  
      if (!user) return res.status(404).json({ error: "User not found" });
  
      res.json({ username: user.username, escapedRooms: user.escapedRooms || [] });
    } catch (error) {
      console.error("Error fetching account data:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

export default router;
