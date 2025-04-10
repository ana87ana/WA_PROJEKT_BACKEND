import express from 'express';
import { connectToDatabase } from '../db.js';
import { getEscapeRooms, authMiddleware } from "../middleware.js"
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

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
        const id = req.params.id;
    
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Neispravan ID format" });
        }
    
        const eroom_collection = db.collection('escape_rooms');
        const escapeRoom = await eroom_collection.findOne({ _id: new ObjectId(id) });
    
        if (!escapeRoom) {
          return res.status(404).json({ error: "Soba nije pronađena" });
        }
    
        res.json(escapeRoom);
      } catch (error) {
        console.error("Greška u backendu:", error);
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


router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const userId = req.authorised_user.id; 
    
    const { time } = req.body; 
    const escapeRoomId = new ObjectId(req.params.id);
    
    const db = await connectToDatabase();
    const eroom_collection = db.collection('escape_rooms');
    const users_collection = db.collection('users');

    const escapeRoom = await eroom_collection.findOne({ _id: escapeRoomId });
    if (!escapeRoom) return res.status(404).json({ error: "Soba nije pronađena" });

    const user = await users_collection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: "Korisnik nije pronađen" });

    let escapedRooms = user.escapedRooms || [];

    const existingEntry = escapedRooms.find(r => r.escapeRoomId.toString() === escapeRoomId.toString());

    if (!existingEntry) {
      await users_collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $push: {
            escapedRooms: {
              escapeRoomId: escapeRoomId,
              firstTime: time.toString(),
              fastestTime: time.toString() 
            }
          }
        }
      );

      await eroom_collection.updateOne(
        { _id: escapeRoomId },
        {
          $push: {
            leaderboard: {
              userId: new ObjectId(userId),
              username: user.username,
              firstTime: time.toString() 
            }
          }
        }
      );

      return res.json({ message: "Prvo vrijeme spremljeno", firstTime: time, fastestTime: time });
    }

    const currentFastest = parseInt(existingEntry.fastestTime, 10);
    const newFastest = Math.min(currentFastest, time); 

    await users_collection.updateOne(
      { _id: new ObjectId(userId), "escapedRooms.escapeRoomId": escapeRoomId },
      {
        $set: {
          "escapedRooms.$.fastestTime": newFastest.toString() 
        }
      }
    );

    return res.json({ message: "Vrijeme ažurirano", firstTime: existingEntry.firstTime, fastestTime: newFastest });

  } catch (error) {
    console.error("Greška:", error);
    res.status(500).json({ error: "Greška tijekom spremanja vremena" });
  }
});


router.get('/leaderboard/:id', async (req, res) => {
    try {
      const db = await connectToDatabase();
      const escapeRoom = await db.collection('escape_rooms').findOne({ _id: new ObjectId(req.params.id) });
  
      if (!escapeRoom) {
        return res.status(404).json({ message: 'Soba nije pronađena' });
      }
  
      const leaderboard = escapeRoom.leaderboard || [];
      
      res.json({
        roomName: escapeRoom.title,
        leaderboard: leaderboard.sort((a, b) => a.time - b.time),
      });
    } catch (error) {
      console.error('Greška pri dohvaćanju leaderborda:', error);
      res.status(500).json({ message: 'Interna greška servera' });
    }
  });

export default router;