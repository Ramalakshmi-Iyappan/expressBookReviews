const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access";

let users = [];

/**
 * Return true if the username is NOT already taken.
 */
const isValid = (username) => {
  if (!username) return false;
  return !users.some(u => u.username === username);
};

/**
 * Return true if a user with this username/password exists.
 */
const authenticatedUser = (username, password) => {
  if (!username || !password) return false;
  return users.some(u => u.username === username && u.password === password);
};

// only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Create JWT AFTER authenticating, using the same secret as index.js
  const accessToken = jwt.sign({ username }, ACCESS_TOKEN_SECRET, { expiresIn: 60 * 60 }); // 1 hour
  req.session.authorization = { accessToken, username };

  return res.status(200).json({
    message: "User successfully logged in",
    token: accessToken,
    username
  });
});

// Add or update a book review (requires logged-in session)
// Add or update a book review (requires logged-in session; review comes from query string)
regd_users.put("/auth/review/:isbn", (req, res) => {
  // 1) Must be logged in (session-based)
  const username = req.session && req.session.authorization && req.session.authorization.username;
  if (!username) {
    return res.status(401).json({ message: "Unauthorized: please log in first" });
  }

  // 2) Review must be provided as a query param: ?review=...
  const review = (req.query.review || "").trim();
  if (!review) {
    return res.status(400).json({ message: "Query parameter 'review' is required" });
  }

  // 3) Your booksdb.js uses numeric keys (1..10), not real ISBNs
  const id = req.params.isbn;         // e.g., "4"
  const book = books[id];
  if (!book) {
    return res.status(404).json({ message: `Book with key ${id} not found` });
  }

  // 4) Upsert the review under the logged-in username
  if (!book.reviews || typeof book.reviews !== "object") {
    book.reviews = {};
  }
  const action = book.reviews[username] ? "updated" : "added";
  book.reviews[username] = review;

  return res.status(200).json({
    message: `Review ${action} successfully`,
    isbn: id,
    reviewer: username,
    review,
    reviews: book.reviews
  });
});
// Delete the logged-in user's review for a book
regd_users.delete("/auth/review/:isbn", (req, res) => {
  // Must be logged in (session-based)
  const username = req.session && req.session.authorization && req.session.authorization.username;
  if (!username) {
    return res.status(401).json({ message: "Unauthorized: please log in first" });
  }

  const id = req.params.isbn;            // your booksdb uses numeric keys like "1","2",...
  const book = books[id];
  if (!book) {
    return res.status(404).json({ message: `Book with key ${id} not found` });
  }

  if (!book.reviews || typeof book.reviews !== "object") {
    book.reviews = {};
  }

  if (!book.reviews[username]) {
    return res.status(404).json({ message: "No review by this user for this book" });
  }

  delete book.reviews[username];

  return res.status(200).json({
    message: "Review deleted successfully",
    isbn: id,
    reviewer: username,
    reviews: book.reviews
  });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
