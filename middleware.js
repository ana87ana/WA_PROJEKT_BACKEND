import { connectToDatabase } from './db.js';
import { verifyJWT } from './login_i_signup/auth.js';
import jwt from 'jsonwebtoken';

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

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; 
  
    if (!token) {
      return res.status(401).json({ error: 'Token nije dostavljen' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.authorised_user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Nevaljan JWT token!' });
    }
  }
export { getUsers, getEscapeRooms, authMiddleware };