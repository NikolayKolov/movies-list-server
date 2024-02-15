const fsp = require('fs').promises;
const moviesJSONPath = './data/movies/MoviesList.json';
const moviesLastUpdatedPath = './data/movies/lastUpdatedAt.json';
// Library that prevents multiple simultaneous read/write operations to a single file
const lockfile = require('proper-lockfile');
const sharp = require('sharp');

class MoviesList {
    // Main list of movies
    #moviesList;
    #lastUpdatedAt;

    // singleton pattern
    constructor () {
        if (MoviesList.instance == null) {
            this.#moviesList = [];
            MoviesList.instance = this;
        }

        return MoviesList.instance;
    }

    async init() {
        this.#moviesList = await this.getAllMovies();
        return MoviesList.instance;
    }

    // getter
    getList() {
        return structuredClone(this.#moviesList);
    }

    // setter
    setList(arrayOfMovies) {
        this.#moviesList = structuredClone(arrayOfMovies);
    }

    // getter
    getTime() {
        return this.#lastUpdatedAt;
    }

    // setter
    setTime(value) {
        this.#lastUpdatedAt = value;
    }

    // get all movies from file and set
    getAllMovies = async () => {
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

    // get the last time the movies list was updated
    getLastUpdatedTime = async () => {
        try {
            const moviesList = await fsp.readFile(moviesLastUpdatedPath, 'utf8');
            const response = JSON.parse(moviesList);
            this.setTime(response.lastUpdatedAt);

            return response.lastUpdatedAt;
        } catch (e) {
            console.log("Error reading/parsing movies time last update: ", e);
            throw e;
        }
    }

    #generateThumbnails = async (fileContents, movieId) => {
        // Check if folder exists and if not, create
        let folderExists = true;
        try {
            await fsp.stat(`public/images/movies/${movieId}`);
        } catch(e) {
            folderExists = false;
        }

        let folderCreated = true;
        if (!folderExists) {
            try {
                await fsp.mkdir(`public/images/movies/${movieId}`);
            } catch(e) {
                folderCreated = false;
            }
        }

        if (!folderCreated) {
            return {
                status: 'error',
                error: 'Could not update poster, please try again later'
            }
        }

        const imageJPG = sharp(fileContents).keepMetadata();
        const promises = [];
        // generate thumbnails and write them
        promises.push(imageJPG.clone().jpeg().toFile(`public/images/movies/${movieId}/main.jpg`));
        promises.push(imageJPG.clone().jpeg({
                quality: 10, compressionLevel: 9
            }).resize(20).toFile(`public/images/movies/${movieId}/thumb-20.jpg`));
        promises.push(imageJPG.clone().jpeg().resize(300).toFile(`public/images/movies/${movieId}/main-300.jpg`));
        promises.push(imageJPG.clone().jpeg().resize(480).toFile(`public/images/movies/${movieId}/main-480.jpg`));

        let result;

        try {
            await Promise.all(promises);
            result = {
                status: 'success'
            }
        } catch (e) {
            result = {
                status: 'error',
                error: 'Could not update poster, please try again later'
            };
        }

        return result;
    }

    #writeToFile = async (filePath, fileContents) => {
        // use lockfile to avoid multiple users editing the file at the same time
        try {
            const release = await lockfile.lock(filePath, {
                // retries object ensures that if another user tries to write,
                // the lockfile will retry in accordance with the settings
                retries: {
                    retries: 5,
                    factor: 3,
                    minTimeout: 50, // in milliseconds
                    maxTimeout: 5 * 1000, // 5 seconds
                    randomize: true,
                }
            });

            // write data to JSON file, which serves as our data base
            await fsp.writeFile(filePath, fileContents, {
                encoding: 'utf8',
                flag: 'w'
            });

            // update the internal class list as well
            this.setList(JSON.parse(fileContents));
            // unlock the file
            await release();

            return {
                status: 'success'
            };
        } catch(e) {
            return {
                status: 'error',
                error: e.message
            };
        }
    }

    addMovie = async (movie) => {
        let maxMovieId = 0;
        if (!this.#moviesList.length) {
            maxMovieId = 1;
        } else {
            // get max movie id from moviesList
            maxMovieId = this.#moviesList.reduce((acc, curr) => {
                if (curr.id > acc) {
                    return curr.id;
                } else {
                    return acc;
                }
            }, this.#moviesList[0].id);

            // increment by 1
            maxMovieId++;
        }

        // generate image files

        const resultPoster = await this.#generateThumbnails(movie.posterImage, maxMovieId);
        if (resultPoster.status === 'error') {
            // exit on error during writing files
            return resultPoster;
        }

        const newMovie = {
            id: maxMovieId,
            title: movie.title,
            director: movie.director,
            distributor: movie.distributor,
            imdb: {
                rating: movie.imdbRating,
                votes: movie.imdbVotes
            },
            images: {
                thumbnailURL: `images/movies/${maxMovieId}/thumb-20.jpg`,
                desktopURL: `images/movies/${maxMovieId}/main-480.jpg`,
                mobileURL: `images/movies/${maxMovieId}/main-300.jpg`,
                mainURL: `images/movies/${maxMovieId}/main.jpg`
            }
        };

        let array = this.getList();
        array.push(newMovie);

        // write new array to file and class
        let result = await this.#writeToFile(moviesJSONPath, JSON.stringify(array));
        if (result.status === 'error') {
            // exit on error during writing to 'database' JSON file
            return result;
        }
        if (result.status === 'success') {
            result = {
                ...result,
                addedMovieId: maxMovieId
            }
        }
        const lastUpdatedAt = new Date(Date.now()).toISOString();
        await this.#writeToFile(moviesLastUpdatedPath, JSON.stringify({ lastUpdatedAt }));

        return result;
    }

    deleteMovie = async (movieId) => {
        const deleteMovieId = Number(movieId);

        if (deleteMovieId < 1) {
            return {
                status: 'error',
                error: 'Movie Id cannot be less than 1!'
            };
        }

        let array = this.getList();
        let movieToDelete = array.find((el) => el.id === deleteMovieId);

        if (movieToDelete === undefined) {
            return {
                status: 'error',
                error: 'Movie Id not in database!'
            };
        }

        array = structuredClone(array.filter((el) => el.id !== deleteMovieId));

        // delete images folder
        // Check if folder exists and if it does, delete it
        let folderExists = true;
        try {
            await fsp.stat(`public/images/movies/${movieId}`);
        } catch(e) {
            folderExists = false;
        }

        let deleteResult = true;
        if (folderExists) {
            try {
                deleteResult = await fsp.rm(`public/images/movies/${movieId}`, { recursive: true, maxRetries: 6 });
            } catch(e) {
                deleteResult = {
                    status: 'error',
                    error: 'Could not delete files, please try again later'
                }
            }
        }
        
        if (deleteResult?.status === 'error') {
            // exit on error during deletion of images folder
            return deleteResult;
        }

        // write new array to file and class
        let result = await this.#writeToFile(moviesJSONPath, JSON.stringify(array));
        if (result.status === 'error') {
            // exit on error during writing to 'database' JSON file
            return result;
        }
        const lastUpdatedAt = new Date(Date.now()).toISOString();
        await this.#writeToFile(moviesLastUpdatedPath, JSON.stringify({ lastUpdatedAt }));

        return result;
    }

    editMovie = async (movie) => {
        const editMovieId = Number(movie.id);

        let array = this.getList();
        const movieToEditIndex = array.findIndex(el => el.id == editMovieId);

        if (movieToEditIndex === -1) {
            return {
                status: 'error',
                error: 'Movie Id not in database!'
            };
        }

        const newMovie = {
            id: movie.id,
            title: movie.title,
            director: movie.director,
            distributor: movie.distributor,
            imdb: {
                rating: movie.imdbRating,
                votes: movie.imdbVotes
            },
            images: {
                ...array[movieToEditIndex].images
            }
        }

        array.splice(movieToEditIndex, 1, newMovie);

        // write image files if any
        let posterImage = undefined;
        if (movie.posterImage !== undefined) posterImage = movie.posterImage;
        if (posterImage) {
            const resultPoster = await this.#generateThumbnails(posterImage, movie.id);
            if (resultPoster.status === 'error') {
                // exit on error during writing files
                return resultPoster;
            }
        }

        // write new array to file and class
        const result = await this.#writeToFile(moviesJSONPath, JSON.stringify(array));
        if (result.status === 'error') {
            // exit on error during writing to 'database' JSON file
            return result;
        }
        const lastUpdatedAt = new Date(Date.now()).toISOString();
        await this.#writeToFile(moviesLastUpdatedPath, JSON.stringify({ lastUpdatedAt }));

        return result;
    }
}

const movies = new MoviesList();
// Async IIFE triggered on first import with require 
(async () => {
    await movies.init();
})();
Object.freeze(movies);

module.exports = movies;