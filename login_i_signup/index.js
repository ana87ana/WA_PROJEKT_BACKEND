import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../db.js';

import { hashPassword, checkPassword, generateJWT, verifyJWT, authMiddleware } from './auth.js';

dotenv.config();

const router = express.Router();
router.use(express.json());
router.use(cors());

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
  const { email, username, password, confirmPassword } = req.body;

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const postojeciUser = await usersCollection.findOne({ username });
    if (postojeciUser) {
      return res.status(400).send('Username već postoji');
    }

    const postojeciEmail = await usersCollection.findOne({ email });
    if (postojeciEmail) {
      return res.status(400).send('Ovaj email je već povezan sa postojećim korisnikom');
    }

    if (password !== confirmPassword) {
      return res.status(400).send('Lozinke nisu iste');
    }

    let hashedPassword = await hashPassword(password, 10);

    const newUser = { email, username, password: hashedPassword };
    await usersCollection.insertOne(newUser);

    res.send('User uspješno registriran');
  } catch (error) {
    res.status(500).send('Došlo je do greške tijekom registriranja korisnika');
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(400).send('Greška prilikom login-a');
    }
    
    let result = await checkPassword(password, user.password);
    if (!result) {
      return res.status(400).send('Greška prilikom login-a');
    }
    
    const isAdmin = user.isAdmin === true;
    
    let token = await generateJWT({ 
      id: user._id, 
      username: user.username,
      isAdmin: user.isAdmin
    });
    
    res.status(200).json({ 
      jwt_token: token,
      isAdmin: isAdmin
    });
  } catch (error) {
    res.status(500).send('Greška prilikom login-a');
  }
});

export default router;