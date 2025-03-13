import express from 'express'
import cors from 'cors';
import { connectToDatabase } from './db.js';

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());

const db = await connectToDatabase();

app.listen(PORT, error => {
  if (error) {
    console.log('Greška prilikom pokretanja servera', error);
  }
  console.log(`Pizza poslužitelj radi na http://localhost:${PORT}`);
});