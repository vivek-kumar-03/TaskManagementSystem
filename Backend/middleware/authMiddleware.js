const jwt = require('jsonwebtoken');
const User = require('../Models/Userdata');

// ... rest of the authMiddleware.js code remains the same

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // console.log('Token received:', token.substring(0, 20) + '...');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user from database to ensure they still exist
    const user = await User.findById(decoded.id).select('-passwordHash -otpCode');
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;