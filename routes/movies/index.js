const express = require('express');
const moviesRouter = express.Router();
const movies = require('../../api/movies');
const { validateFormData, validatePoster } = require('../../data/validators/movieValidators');
const authUserRequest = require('../../middleware/authMiddelware');

moviesRouter
    // get list of all movies
    .get('/', async (_req, res) => {
        try {
            const resp = await movies.getAllMovies();
            res.json(resp);
            res.status(200);
            res.end();
        } catch (e) {
            res.json({
                name: e.name,
                message: e.message
            });
            res.status(500);
            res.end();
        }
    })
    .get('/lastupdatedat', async (_req, res) => {
        try {
            const lastUpdatedAt = await movies.getLastUpdatedTime();
            res.json(lastUpdatedAt);
            res.status(200);
            res.end();
        } catch (e) {
            res.json({
                name: e.name,
                message: e.message
            });
            res.status(500);
            res.end();
        }
    });

moviesRouter
    // edit an existing movie by id
    .post('/edit/:movieId', authUserRequest, async (req, res) => {
        const movieId = req.params.movieId;
        let validateForm = validateFormData({ ...req.body });

        let file = undefined;
        if (req.files) file = req.files.find(fl => fl.fieldname === 'posterImage');

        if (file !== undefined) {
            let validateFile = await validatePoster(file.buffer);
            if (validateFile !== true) {
                if (validateForm === true) validateForm = {...validateForm};
                else validateForm = {...validateForm, ...validateFile};
            }
        }

        if (validateForm !== true) {
            res.status(400);
            res.json(validateForm);
            res.end();
        }

        const newMovie = {
            ...req.body,
            id: movieId,
        };

        if (file !== undefined) newMovie.posterImage = file.buffer;

        try {
            await movies.editMovie(newMovie);
            res.status(201);
            const lastUpdatedAt = await movies.getLastUpdatedTime();
            res.json({
                lastUpdatedAt
            });
            res.end();
        } catch (e) {
            res.status(500);
            res.json({
                name: e.name,
                message: e.message
            });
            res.end();
        }
    });

moviesRouter
    // delete an existing movie by id
    .post('/delete/:movieId', authUserRequest, async (req, res) => {
        const movieId = req.params.movieId;
        try {
            const resul = await movies.deleteMovie(movieId);
            if (resul?.status === 'error') {
                res.status(500);
                res.json({
                    status: 'error',
                    message: resul.error
                });
                res.end();
                return;
            }
            res.status(201);
            const lastUpdatedAt = await movies.getLastUpdatedTime();
            res.json({
                lastUpdatedAt
            });
            res.end();
        } catch (e) {
            res.status(500);
            res.json({
                status: 'error',
                name: e.name,
                message: e.message
            });
            res.end();
        }
    });

moviesRouter
    // delete an existing movie by id
    .post('/create/', authUserRequest, async (req, res) => {
        let validateForm = validateFormData({ ...req.body });

        let file = undefined;
        if (req.files) file = req.files.find(fl => fl.fieldname === 'posterImage');

        if (file !== undefined) {
            let validateFile = await validatePoster(file.buffer);
            if (validateFile !== true) {
                if (validateForm === true) validateForm = {
                    posterImage: validateFile.errorMessage
                };
                else validateForm = {
                    ...validateForm,
                    posterImage: validateFile.errorMessage
                };
            }
        }

        if (validateForm !== true) {
            res.status(400);
            res.json(validateForm);
            res.end();
            return;
        }
    
        try {
            const resul = await movies.addMovie({
                ...req.body,
                posterImage: file.buffer
            });
            res.status(201);
            const lastUpdatedAt = await movies.getLastUpdatedTime();
            res.json({
                lastUpdatedAt,
                addedMovieId: resul.addedMovieId
            });
            res.end();
        } catch (e) {
            res.status(500);
            res.json({
                status: 'error',
                name: e.name,
                message: e.message
            });
            res.end();
        }
    });

module.exports = moviesRouter;