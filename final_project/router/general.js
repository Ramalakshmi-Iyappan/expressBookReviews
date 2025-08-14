const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');
const PORT = process.env.PORT || 5000;
const LOCAL_BASE = `http://127.0.0.1:${PORT}`;

 // avoids HTTPS proxy EPROTO issues


public_users.post("/register", (req, res) => {
    const { username, password } = req.body || {};
  
    // 1) Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
  
    // 2) Check if username already exists
    if (typeof isValid === "function" && !isValid(username)) {
      return res.status(409).json({ message: "Username already exists" });
    }
    if (Array.isArray(users) && users.find(u => u.username === username)) {
      return res.status(409).json({ message: "Username already exists" });
    }
  
    // 3) Create user
    users.push({ username, password });
  
    return res.status(201).json({
      message: "User successfully registered",
      username
    });
  });
  public_users.get('/', function (req, res) {
    return res.status(200).send(JSON.stringify(books, null, 4));
  });

  // Async/Await + Axios: get book by "ISBN" (numeric key) via the existing /isbn/:isbn route
public_users.get('/axios/isbn/:isbn/async', async (req, res) => {
    try {
      const { isbn } = req.params;
      const r = await axios.get(`${LOCAL_BASE}/isbn/${encodeURIComponent(isbn)}`);
      return res.status(200).send(JSON.stringify(r.data, null, 4));
    } catch (err) {
      const status = err.response?.status || 500;
      const msg = err.response?.data || err.message;
      return res.status(status).json({ message: 'Error fetching book via axios (async/await)', error: msg });
    }
  });
  
  // Promise (.then/.catch) + Axios
  public_users.get('/axios/isbn/:isbn/promise', (req, res) => {
    const { isbn } = req.params;
    axios.get(`${LOCAL_BASE}/isbn/${encodeURIComponent(isbn)}`)
      .then(r => res.status(200).send(JSON.stringify(r.data, null, 4)))
      .catch(e => {
        const status = e.response?.status || 500;
        const msg = e.response?.data || e.message;
        res.status(status).json({ message: 'Error fetching book via axios (promise)', error: msg });
      });
  });
  
// Get the book list available in the shop
// Get all books using Axios + async/await

// Async/Await + Axios
public_users.get('/books/async', async (req, res) => {
  try {
    const r = await axios.get(`${LOCAL_BASE}/`);  // calls Task-1 route locally over HTTP
    let data = r.data;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch {} }
    return res.status(200).send(JSON.stringify(data, null, 4));
  } catch (err) {
    return res.status(500).json({
      message: 'Error fetching books via axios (async/await)',
      error: err.message
    });
  }
});

// Optional: Promises version
public_users.get('/books/promise', (req, res) => {
  axios.get(`${LOCAL_BASE}/`)
    .then(r => {
      let data = r.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch {} }
      res.status(200).send(JSON.stringify(data, null, 4));
    })
    .catch(e => {
      res.status(500).json({
        message: 'Error fetching books via axios (promise)',
        error: e.message
      });
    });
});

// Get book details based on ISBN (robust: matches either object key or the book.isbn property)
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  // 1) Direct lookup if your books object uses ISBN as a key
  if (books[isbn]) {
    return res.status(200).send(JSON.stringify(books[isbn], null, 4));
  }

  // 2) Otherwise search by the internal isbn property (typical for the assignment)
  const found = Object.values(books).find(b => (b.isbn + "") === (isbn + ""));
  if (found) {
    return res.status(200).send(JSON.stringify(found, null, 4));
  }

  return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;
  const matches = [];

  for (const key of Object.keys(books)) {
    const b = books[key];
    if (b?.author && b.author.toLowerCase() === author.toLowerCase()) {
      matches.push(b);
    }
  }

  if (matches.length > 0) {
    return res.status(200).send(JSON.stringify(matches, null, 4));
  }
  return res.status(404).json({ message: `No books found by author ${author}` });
}); // <-- this was missing and caused nodemon to crash


// Async/Await + Axios → get books by author
public_users.get('/axios/author/:author/async', async (req, res) => {
    try {
      const { author } = req.params;
      const r = await axios.get(`${LOCAL_BASE}/author/${encodeURIComponent(author)}`);
      let data = r.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch {} }
      return res.status(200).send(JSON.stringify(data, null, 4));
    } catch (err) {
      const status = err.response?.status || 500;
      return res.status(status).json({
        message: 'Error fetching books by author via axios (async/await)',
        error: err.response?.data || err.message
      });
    }
  });
  
  // Promise (.then/.catch) + Axios → get books by author
  public_users.get('/axios/author/:author/promise', (req, res) => {
    const { author } = req.params;
    axios.get(`${LOCAL_BASE}/author/${encodeURIComponent(author)}`)
      .then(r => {
        let data = r.data;
        if (typeof data === 'string') { try { data = JSON.parse(data); } catch {} }
        res.status(200).send(JSON.stringify(data, null, 4));
      })
      .catch(e => {
        const status = e.response?.status || 500;
        res.status(status).json({
          message: 'Error fetching books by author via axios (promise)',
          error: e.response?.data || e.message
        });
      });
  });

  

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;
  const matches = [];

  for (const key of Object.keys(books)) {
    const b = books[key];
    if (b?.title && b.title.toLowerCase() === title.toLowerCase()) {
      matches.push(b);
    }
  }

  if (matches.length > 0) {
    return res.status(200).send(JSON.stringify(matches, null, 4));
  }
  return res.status(404).json({ message: `No books found with title ${title}` });
});

// Async/Await + Axios → get books by title
public_users.get('/axios/title/:title/async', async (req, res) => {
    try {
      const { title } = req.params;
      const r = await axios.get(`${LOCAL_BASE}/title/${encodeURIComponent(title)}`);
      let data = r.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (_) {} }
      return res.status(200).send(JSON.stringify(data, null, 4));
    } catch (err) {
      const status = (err.response && err.response.status) || 500;
      const msg = (err.response && err.response.data) || err.message;
      return res.status(status).json({
        message: 'Error fetching books by title via axios (async/await)',
        error: msg
      });
    }
  });
  
  // Promise (.then/.catch) + Axios → get books by title
  public_users.get('/axios/title/:title/promise', (req, res) => {
    const { title } = req.params;
    axios.get(`${LOCAL_BASE}/title/${encodeURIComponent(title)}`)
      .then(r => {
        let data = r.data;
        if (typeof data === 'string') { try { data = JSON.parse(data); } catch (_) {} }
        res.status(200).send(JSON.stringify(data, null, 4));
      })
      .catch(e => {
        const status = (e.response && e.response.status) || 500;
        const msg = (e.response && e.response.data) || e.message;
        res.status(status).json({
          message: 'Error fetching books by title via axios (promise)',
          error: msg
        });
      });
  });
  
// Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  // Try key directly first
  let book = books[isbn];
  if (!book) {
    // Fallback: search by internal isbn property
    book = Object.values(books).find(b => (b.isbn + "") === (isbn + ""));
  }

  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  // Many templates store reviews as an object on the book
  const reviews = book.reviews || {};
  return res.status(200).send(JSON.stringify(reviews, null, 4));
});



  
module.exports.general = public_users;
