import { connectToDatabase } from './db.js';

const db = await connectToDatabase();

const getEscapeRooms = async (req, res, next) => {
    try {
        const eroom_collection = db.collection('escape_rooms');
        req.escapeRooms = await eroom_collection.find().toArray();
        next();
    } catch (error) {
        res.status(500).json({ error: "Greška tijekom dohvaćanja soba" });
    }
};

const getUsers = async (req, res, next) => {
    try {
        const users_collection = db.collection('users');
        req.users = await users_collection.find().toArray(); 
        next(); 
    } catch (error) {
        res.status(500).json({ error: "Greška tijekom dohvaćanja korisnika" });
    }
};

export { getUsers, getEscapeRooms };