const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  console.log('Auth header received:', authHeader ? 'Bearer ***' : 'NONE');
  if (!authHeader) {
    return res.status(401).json({ message: 'Not authenticated - no auth header' });
  }
  const token = authHeader.split(" ")[1];
  
  // Handle hardcoded admin token
  if (token === "admin-token") {
    req.userId = "admin";
    req.User = { userId: "admin", role: "admin" };
    return next();
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.SECRET);
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  if (!decodedToken) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  req.userId = decodedToken.userId;
  req.User = decodedToken;

  next();
};