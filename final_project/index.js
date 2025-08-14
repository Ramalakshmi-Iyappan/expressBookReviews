const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access";

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req, res, next) {
    if (!req.session || !req.session.authorization) {
      return res.status(403).json({ message: "User not logged in" });
    }
  
    const token = req.session.authorization.accessToken;
    if (!token) {
      return res.status(403).json({ message: "Access token missing" });
    }
  
    try {
      const user = jwt.verify(token, ACCESS_TOKEN_SECRET);
      req.user = user;
      return next();
    } catch (err) {
      return res.status(403).json({ message: "User not authenticated" });
    }
  });
  
 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
