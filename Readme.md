# Movies list Node.js Backend for a React frontend

# Pre-requisites
- Install [Node.js](https://nodejs.org/en/) version 20.0.0+

## Getting started
- Clone the repository
```
git clone https://github.com/NikolayKolov/movies-list-server
```
- Install dependencies
```
cd movies-list-server
npm install
```
- Build and run the project
```
npm run dev
```
# Repository purpose
The main purpose of this repository is to hold a project for a Node.js server backend for a movies database React frontend in the package [movies-list-server](https://github.com/NikolayKolov/movies-list-client). The communication between frontend and backend is done in RESTful API HTTP requests returning JSON data.

The "database" is stored in JSON files. Access and concurrency control is achieved using the [proper-lockfile module](https://github.com/moxystudio/node-proper-lockfile).

Security is achieved using JWT token authorization. API endpoints that are responsible for editing, adding and deleting movies are protected with a JWT authentication middleware. Endpoints for fetching movies list data are available without authentication. 

Movie images need to be resized. This is done with the [sharp package](https://sharp.pixelplumbing.com/).
 