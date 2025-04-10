import express from 'express';
import { connectToDatabase } from '../db.js';
import { getUsers, authMiddleware } from "../middleware.js"
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const db = await connectToDatabase();

const validateEscapeRoom = [
    body('title').notEmpty().withMessage('Title is required'),
    body('genre').notEmpty().withMessage('Genre is required'),
    body('difficulty').isIn(['Easy', 'Normal', 'Hard', 'Expert']).withMessage('Valid difficulty is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('subrooms').isArray({ min: 4, max: 4 }).withMessage('Exactly 4 subrooms are required'),
    body('subrooms.*.type').isIn(['number_guess', 'image_sentence', 'emoji_guess', 'person_connection'])
      .withMessage('Invalid subroom type'),
    body('subrooms.*.questions').isArray({ min: 1, max: 1 }).withMessage('Each subroom should have exactly one question')
];
  
router.get('/users', getUsers, async (req, res) => {
    try {
        let allusers = req.users;
        res.json(allusers);
    } catch (error) {
        res.status(500).json({ error: "Greška tijekom dohvaćanja korisnika" });
    }
});

router.post('/add_room', validateEscapeRoom, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }
  
      const escapeRoomData = req.body;
      
      const validationErrors = [];
      
      for (let i = 0; i < escapeRoomData.subrooms.length; i++) {
        const subroom = escapeRoomData.subrooms[i];
        const question = subroom.questions[0];
        
        switch (subroom.type) {
          case 'number_guess':
            if (!question.question) validationErrors.push(`Subroom ${i+1}: Question text is required`);
            if (!question.answer) validationErrors.push(`Subroom ${i+1}: Answer is required`);
            break;
            
          case 'image_sentence':
            if (!question.images || question.images.length < 1) 
              validationErrors.push(`Subroom ${i+1}: At least one image URL is required`);
            if (!question.answer) validationErrors.push(`Subroom ${i+1}: Answer is required`);
            break;
            
          case 'emoji_guess':
            if (!question.image) validationErrors.push(`Subroom ${i+1}: Emoji image URL is required`);
            if (!question.answer) validationErrors.push(`Subroom ${i+1}: Answer is required`);
            break;
            
          case 'person_connection':
            if (!question.answer) validationErrors.push(`Subroom ${i+1}: Person name is required`);
            if (!question.items || question.items.length < 1) 
              validationErrors.push(`Subroom ${i+1}: At least one connection item is required`);
            break;
        }
        
        if (!question.hints || question.hints.length < 1) {
          validationErrors.push(`Subroom ${i+1}: At least one hint is required`);
        } else {

          question.hints = question.hints.filter(hint => hint.trim() !== '');
          if (question.hints.length === 0) {
            validationErrors.push(`Subroom ${i+1}: At least one non-empty hint is required`);
          }
        }
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: 'Validation error', errors: validationErrors });
      }
    
      const escapeRoomsCollection = db.collection('escape_rooms');
      const result = await escapeRoomsCollection.insertOne(escapeRoomData);
      
      res.status(201).json({
        message: 'Escape room created successfully',
        id: result.insertedId
      });

    } catch (error) {
      console.error('Error creating escape room:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;