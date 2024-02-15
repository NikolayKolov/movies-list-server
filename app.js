const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
require('dotenv').config();
const routes = require('./routes');

const app = express();

// Port Number
const PORT = process.env.PORT || 5000;

// Make resources in public folder visible
app.use(express.static('public'));
// Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true }));
// Parse multiform form data and files
app.use(multer().any());

// load routes
app.use('/api', routes);

// Server Setup
app.listen(PORT, (error) => {
    if (error) {
        console.log('Server error: ', error);
    } else {
        console.log(`Server started on port ${PORT}`);
    }
});