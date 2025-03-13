import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../db.js';

import { hashPassword, checkPassword, generateJWT, verifyJWT, authMiddleware } from './auth.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;


app.get('/objave', authMiddleware, async (req, res) => {
  let userObjave = objave.filter(objava => objava.autor === req.authorised_user.username); // dohvaćamo podatke iz dekodiranog payloada (req.authorised_user)

  res.json(userObjave);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const postojeciUser = await usersCollection.findOne({ username });
    if (postojeciUser) {
      return res.status(400).send('Username već postoji');
    }

    let hashedPassword = await hashPassword(password, 10);

    const newUser = { username, password: hashedPassword };
    await usersCollection.insertOne(newUser);

    res.send('User successfully registered!');
  } catch (error) {
    res.status(500).send('Error registering user.');
  }
});

app.post('/login', async (req, res) => {
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

    let token = await generateJWT({ id: user._id, username: user.username });
    res.status(200).json({ jwt_token: token });
  } catch (error) {
    res.status(500).send('Greška prilikom login-a');
  }
});

app.listen(PORT, () => {
  console.log(`Poslužitelj se nalazi na portu ${PORT}`);
});