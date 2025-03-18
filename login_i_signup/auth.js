import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

async function hashPassword(plainPassword, saltRounds) {
  try {
    let hash = await bcrypt.hash(plainPassword, saltRounds);
    return hash;
  } catch (err) {
    console.error(`Došlo je do greške prilikom hashiranja lozinke: ${err}`);
    return null;
  }
}

async function checkPassword(plainPassword, hashedPassword) {
  try {
    let result = await bcrypt.compare(plainPassword, hashedPassword);
    return result;
  } catch (err) {
    console.error(`Došlo je do greške prilikom usporedbe hash vrijednosti: ${err}`);
    return false;
  }
}

async function generateJWT(payload) {
  try {
    let token = jwt.sign(payload, JWT_SECRET); 
    return token;
  } catch (err) {
    console.error(`Došlo je do greške prilikom generiranja JWT tokena: ${err}`);
    return null;
  }
}

async function verifyJWT(token) {
  try {
    let decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error(`Došlo je do greške prilikom verifikacije JWT tokena: ${err}`);
    return null;
  }
}

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.headers.authorization.split(' ')[1];
    let decoded = await verifyJWT(token);

    if (!decoded) {
      return res.status(401).send('Nevaljan JWT token!');
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username: decoded.username });

    if (!user) {
      return res.status(401).send('User nije pronađen!');
    }

    req.authorised_user = decoded;
    next();
  } catch (error) {
    res.status(500).send('Greška u provjeri autorizacije');
  }
};

export { hashPassword, checkPassword, generateJWT, verifyJWT, authMiddleware };