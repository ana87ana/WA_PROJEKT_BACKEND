import express from 'express'
import cors from 'cors';
import { connectToDatabase } from './db.js';
import authRouter from "./login_i_signup/index.js"
import eroomRouter from "./routes/escape_room.js"
import userRouter from "./routes/user.js"
import adminRouter from "./routes/admin.js"
import dotenv from 'dotenv'

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());
dotenv.config();

const db = await connectToDatabase();

app.use("/", authRouter);
app.use("/escape_room", eroomRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);

app.listen(PORT, error => {
  if (error) {
    console.log('Greška prilikom pokretanja servera', error);
  }
  console.log(`Poslužitelj radi na http://localhost:${PORT}`);
});