const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { auth, admin } = require('../middleware/auth');

// Add a new book
router.post('/', [auth, admin], async (req, res) => {
  const { title, author, genre, rating } = req.body;

  if (!title || !author || !genre) {
    return res.status(400).json({ message: 'Title, author, and genre are required' });
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    const newBook = new Book({ title, author, genre, rating });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all books with pagination and filters
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, genre, rating, search } = req.query;
  const query = {};

  if (genre) {
    query.genre = { $regex: genre, $options: 'i' };
  }

  if (rating) {
    query.rating = { $gte: parseFloat(rating) };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    const books = await Book.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Book.countDocuments(query);

    res.json({
      books,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
