const express = require('express')
const router = express.Router()
const userModel = require('../models/userModel')
const { generateToken } = require('../utils/generateToken')
const bcrypt = require('bcrypt');

router.post('/create', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await userModel.create({
            username,
            email,
            password: hashedPassword,
        });

        const token = generateToken(newUser);
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // true in production
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Something went wrong');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // set to true in production with HTTPS
            sameSite: 'Lax', // or 'None' if using different domains and HTTPS
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({ message: 'Login successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'Lax', // or 'None' if using cross-site
        secure: process.env.NODE_ENV === 'production',
    });
    res.status(200).json({ message: 'Logged out successfully' });
});



module.exports = router;