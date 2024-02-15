const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const usersList = require('../data/users/UsersList.json');

class UserAuthenticator {
    #usersData;

    // singleton pattern
    constructor() {
        if (UserAuthenticator.instance == null) {
            this.#usersData = usersList;
            UserAuthenticator.instance = this;
        }

        return UserAuthenticator.instance;
    }

    // get all movies from file and set
    getAllUsers = async () => {
        try {
            const moviesList = await fsp.readFile(moviesJSONPath, 'utf8');
            const response = JSON.parse(moviesList);
            this.setList(response);

            return response;
        } catch (e) {
            console.log("Error reading/parsing movies list: ", e);
            throw e;
        }
    }

    // getter
    getList() {
        return structuredClone(this.#usersData);
    }

    generatePasswordHash = async (password) => {
        // 4 is the lowest number of salt rounds that can be used for generating salt values
        const salt = await bcrypt.genSalt(4);
        const hash = await bcrypt.hash(password, salt);

        return hash;
    }

    authenticateUserPassword = async (username, password) => {
        const user = this.#usersData.find((usr) => usr.userName === username);
        if (user === undefined) {
            return {
                status: 'error',
                message: `Username ${username} not in database!`
            }
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (isValid) {
            return {
                status: 'success'
            }
        } else {
            return {
                status: 'error',
                message: "Username and password don't match!"
            }
        }
    }

    generateJWT = (username) => {
        const user = this.#usersData.find((usr) => usr.userName === username);
        if (user === undefined) {
            return {
                status: 'error',
                message: `Username ${username} not in database!`
            }
        }
        const token = jwt.sign({
            sub: user.id,
            name: username
        }, process.env.TOKEN_KEY, {
            // expires in one week
            expiresIn: "7d",
        });

        return token;
    }

    verifyJWT = (token) => {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);

        return decoded;
    }
}

const users = new UserAuthenticator();
Object.freeze(users);

module.exports = users;