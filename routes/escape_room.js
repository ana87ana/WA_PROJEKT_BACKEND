import express from 'express';
import { connectToDatabase } from '../db.js';
import { getEscapeRooms } from "../middleware.js"

const router = express.Router();
const db = await connectToDatabase();

router.get('/', getEscapeRooms , async (req, res) => {
    try {
        let allerooms = req.escapeRooms;
        res.json(allerooms);
    } catch (error) {
        res.status(500).json({ error: "Greška tijekom dohvaćanja soba" });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const eroom_collection = db.collection('escape_rooms');
        const escapeRoom = await eroom_collection.findOne({ _id: new ObjectId(req.params.id) });

        if (!escapeRoom) {
            return res.status(404).json({ error: "Soba nije pronađena" });
        }
        res.json(escapeRoom);
    } catch (error) {
        res.status(500).json({ error: "Greška tijekom dohvaćanja sobe" });
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, genre, difficulty, subrooms, timeLimit } = req.body;
        
        if (!title || !genre || !difficulty || !subrooms || !timeLimit) {
            return res.status(400).json({ error: "Nedostaju ključne vrijednosti" });
        }

        const eroom_collection = db.collection('escape_rooms');
        const newRoom = { title, genre, difficulty, subrooms, timeLimit, leaderboard: [] };

        const result = await eroom_collection.insertOne(newRoom);
        res.status(201).json({ message: "Stvorena nova soba!", id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: "Greška prilikom stvaranja sobe" });
    }
});


router.post('/:id/complete', async (req, res) => {
    try {
        const { userId, username, time } = req.body;
        const eroom_collection = db.collection('escape_rooms');

        const escapeRoom = await eroom_collection.findOne({ _id: new ObjectId(req.params.id) });
        if (!escapeRoom) return res.status(404).json({ error: "Greška tijekom pronalaženja sobe" });

        const existingEntry = escapeRoom.leaderboard.find(entry => entry.userId.equals(new ObjectId(userId)));

        if (!existingEntry) {
            await eroom_collection.updateOne(
                { _id: new ObjectId(req.params.id) },
                { $push: { leaderboard: { userId: new ObjectId(userId), username, time } } }
            );
        }

        
        const users_collection = db.collection('users');
        await users_collection.updateOne(
            { _id: new ObjectId(userId), "fastestTimes.escapeRoomId": new ObjectId(req.params.id) },
            { $min: { "fastestTimes.$.time": time } }, 
            { upsert: true } 
        );

        res.json({ message: "Pohranjeno vrijeme" });
    } catch (error) {
        res.status(500).json({ error: "Došlo je do greške!" });
    }
});

export default router;