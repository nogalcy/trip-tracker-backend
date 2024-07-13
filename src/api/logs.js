const { Router } = require('express');
const LogEntry = require('../models/LogEntry.js');
const { authenticateUser } = require('../middlewares.js')
const User = require('../models/User.js')
const router = Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const userEntry = new User({ name, email, password });
        const createdUser = await userEntry.save();
        const token = jwt.sign({_id: createdUser._id, email: createdUser.email}, process.env.JWT_SECRET, {expiresIn: '1hr'})
        res.json({user: createdUser, token});
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: 'Fail Username' })
        }
        const isPasswordvalid = await bcrypt.compare(password, user.password);
        if (!isPasswordvalid) {
            return res.json({ message: 'Fail Password' });
        }
        const token = jwt.sign({_id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1hr'})
        res.json({ message: 'Success', token, user});
    } catch (err) {
        next(err);
    }
})

router.get('/map', authenticateUser, async (req, res, next) => {
    try {
        const entries = await LogEntry.find({ user: req.user.email });
        res.json(entries);
    } catch (error) {
        next(error);
    }
});

router.post('/map', authenticateUser, async (req, res, next) => {
    try {
        const logEntry = new LogEntry({
            ...req.body,
            user: req.user.email
        });
        const createdEntry = await logEntry.save();
        res.json(createdEntry);
    } catch(error) {
        if (error.name === 'ValidationError') {
            res.status(422);
        }
        next(error);
    }
});

router.delete('/delete/:id', authenticateUser, async (req, res, next) => {
    try {
        const id = req.params.id;
        await LogEntry.findByIdAndDelete(id).exec();
        res.json({message: "Successful Deletion"});
    } catch (error) {
        console.error(error);
    }
})

router.put('/update-trip/:id', authenticateUser, async (req, res, next) => {
    try {
        const id = req.params.id;
        const updatedEntry = await LogEntry.findByIdAndUpdate(id, req.body, {new: true});
        res.json(updatedEntry);
    } catch (error) {
        next(error);
    }
})

router.get('/profile', authenticateUser, async (req, res, next) => {
    try {
        const entries = await LogEntry.find({user: req.user.email}).sort({visitDate: -1}).limit(6);
        res.json(entries);
    } catch (error) {
        next(error);
    }
})

router.get('/profile/favorites', authenticateUser, async (req, res, next) => {
    try {
        const entries = await LogEntry.find({user: req.user.email}).sort({rating: -1, visitDate: -1 }).limit(6);
        res.json(entries);
    } catch (error) {
        next(error);
    }
})

router.get('/profile/user-information', authenticateUser, async (req, res, next) => {
    try {
        const entries = await LogEntry.find({ user: req.user.email });
        const user = await User.findOne({ email: req.user.email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const createdDate = formatDate(user.createdAt);
        const numberOfEntries = entries.length;
        const userEmail = user.email;
        const name = user.name;
        const favoriteTrip = await LogEntry.find({ user: req.user.email }).sort({ rating: -1, visitDate: -1 }).limit(1);

        console.log("Info:", name, userEmail, favoriteTrip, numberOfEntries, createdDate);
        
        res.json({
            createdDate: createdDate,
            entryCount: numberOfEntries,
            email: userEmail,
            name: name,
            favoriteTrip: favoriteTrip.length > 0 ? favoriteTrip[0] : null
        });
    } catch (error) {
        console.error("Error fetching user information:", error);
        next(error);
    }
});


module.exports = router;