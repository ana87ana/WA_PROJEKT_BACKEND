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

router.get('/', async (req, res) => {

})

export default router;