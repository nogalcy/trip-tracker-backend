require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

const middlewares = require('./middlewares.js');
const logs = require('./api/logs.js');

const app = express();

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Database connected'))
  .catch((error) => console.log('Database connection error:', error));

app.use(morgan('combined'));
app.use(helmet());

const corsOptions = {
  origin: 'https://trip-tracker-v8v4.onrender.com',
  // origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true, // Allow cookies to be sent with requests
  maxAge: 7200, // Cache preflight response for 2 hours
};

app.use(cors(corsOptions));

app.use(express.json());

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://trip-tracker-v8v4.onrender.com');
  // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Max-Age', 7200);
  res.status(204).send(); // No Content
});

app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!',
  });
});

app.use('/api/logs', logs);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

const port = process.env.PORT || 1337;
app.listen(port, () => {
  console.log(`Server running`);
});
