require('dotenv').config();
const path = require('path');
app.use(express.static(path.join(__dirname, "build")));

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

app.use(cors({
    origin: process.env.CORS_ORIGIN
}));

app.use(express.json());

app.use('/api/logs', logs);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

const port = process.env.PORT || 1337;
app.listen(port, () => {
  console.log(`Server running`);
});
