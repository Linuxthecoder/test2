const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// ===== Configuration =====
const config = {
    MONGO_URI: 'mongodb+srv://pubghearbeat:jkEZplxXAlUKts4B@clusterforcodethereper.60yo9.mongodb.net/?retryWrites=true&w=majority&appName=clusterforcodethereper',
    JWT_SECRET: 'e4b8e6b83a2d4c3499a6d9fb1d4580e4d77b31a25887a5b0fcb6a1c7f62f4091',
    FRONTEND_URL: 'http://localhost:3000',
    PORT: 5000
};

// ===== Connect to MongoDB =====
mongoose.connect(config.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
}).then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => {
      console.error('❌ MongoDB Connection Error:', err.message);
      process.exit(1);
});

// ===== Middleware =====
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== Define MongoDB Schemas =====
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const websiteRequestSchema = new mongoose.Schema({
  user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true } // ✅ Now it accepts both ID & username
  },
  phone: { type: String, required: true },
  websiteType: { type: String, required: true },
  requirements: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});


const User = mongoose.model('User', userSchema);
const WebsiteRequest = mongoose.model('WebsiteRequest', websiteRequestSchema);

// ===== Authentication Middleware =====
const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized access' });

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ error: 'User not found' });

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// ===== Signup Route =====
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;

        if (!username || !email || !phone || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({
                error: existingUser.username === username
                    ? 'Username already exists'
                    : 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, phone, password: hashedPassword });

        const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, { expiresIn: '2h' });

        res.status(201).json({ success: true, token, user: { id: user._id, username, email, phone } });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===== Login Route =====
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ username }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, { expiresIn: '2h' });

        res.json({ success: true, token, user: { id: user._id, username, email: user.email, phone: user.phone } });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===== Website Request Route =====
app.post('/api/request-website', protect, async (req, res) => {
  try {
        const { phone, websiteType, requirements, password } = req.body;

        if (!phone || !websiteType || !requirements || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const user = await User.findById(req.user._id).select('+password');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password. Request denied.' });
        }

        const newRequest = await WebsiteRequest.create({
          user: {
              id: new mongoose.Types.ObjectId(req.user._id), 
              name: req.user.username 
          },
          phone,
          websiteType,
          requirements
      });
      

        res.status(201).json({
            success: true,
            message: 'Website request submitted successfully!',
            request: newRequest
        });

      } catch (error) {
        console.error("Request Error:", error); // 🚨 Add this line
        res.status(500).json({ error: "Failed to submit website request" });
      }
    });

// ===== Start Server =====
app.listen(config.PORT, () => {
    console.log(`🚀 Server running on port ${config.PORT}`);
});
