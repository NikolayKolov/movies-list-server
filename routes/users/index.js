const express = require('express');
const usersRouter = express.Router();
const users = require('../../api/users');

usersRouter
    .post('/login', async (req, res) => {
        const username = req.body.username;
        const password = req.body.password;
        const authenticate = await users.authenticateUserPassword(username, password);
        if (authenticate.status === 'error') {
            res.status(403);
            res.json({
                error: authenticate.message
            });
        } else {
            res.status(200);
            const token = users.generateJWT(username);
            res.json({
                jwt: token
            });
        }
        res.end();
    });

module.exports = usersRouter;