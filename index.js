import express from 'express'
import cors from 'cors';
import { connectToDatabase } from './db.js';
import authRouter from "./login_i_signup/index.js"
import eroomRouter from "./routes/escape_room.js"

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());

const db = await connectToDatabase();

app.use("/", authRouter);
app.use("/escape_room", eroomRouter);

app.listen(PORT, error => {
  if (error) {
    console.log('Greška prilikom pokretanja servera', error);
  }
  console.log(`Poslužitelj radi na http://localhost:${PORT}`);
});