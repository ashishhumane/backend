const jwt = require('jsonwebtoken')
const userModel = require('../models/user')

module.exports = async function (req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'No token found' });
    }

    try {
    console.log('Token received:', token);
    console.log('JWT_SECRET used:', process.env.JWT_KEY); // remove later in production

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded;
    next();
} catch (err) {
    console.error('JWT Error:', err.name, err.message); // Log error details
    return res.status(401).json({ message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
}
};