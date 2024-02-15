const users = require('../api/users');

const authUserRequest = (req, res, next) => {
    let token = req.header('Authorization');
    if (!token) {
        return res.status(403).json({
            status: 'authError',
            message: 'Unauthorized'
        });
    }
    token = token.split(' ')[1]; // Remove 'Bearer ' string
    try {
        users.verifyJWT(token);
        next();
    } catch (e) {
        return res.status(403).json({
            status: 'authError',
            message: 'Invalid credentials'
        });
    }
}

module.exports = authUserRequest;