const express = require('express');
const mainRouter = express.Router();
const movieRoutes = require('./movies');
const usersRouter = require('./users');

// load movie routes
mainRouter.use('/movies', movieRoutes);
mainRouter.use('/users', usersRouter);

module.exports = mainRouter;