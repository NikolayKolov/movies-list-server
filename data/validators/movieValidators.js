const sharp = require('sharp');

const validateMethods = {
    title: (value) => {
        if (typeof value !== 'string'){
            return {
                error: true,
                errorMessage: "Title must be a string"
            }
        }
        const isOK = /.+/.test(value);
        if (isOK) return true;

        return {
            error: true,
            errorMessage: "Title must contain at least one character"
        }
    },
    director: (value) => {
        if (typeof value !== 'string'){
            return {
                error: true,
                errorMessage: "Director name must be a string"
            }
        }

        const isOK = /.+/.test(value);
        if (isOK) return true;

        return {
            error: true,
            errorMessage: "Director name must contain at least one character"
        }
    },
    distributor: (value) => {
        if (typeof value !== 'string'){
            return {
                error: true,
                errorMessage: "Distributor name must be a string"
            }
        }

        const isOK = /.+/.test(value);
        if (isOK) return true;

        return {
            error: true,
            errorMessage: "Distributor name must contain at least one character"
        }
    },
    imdbRating: (value) => {
        const newValue = Number(value);
        if (typeof newValue !== 'number'){
            return {
                error: true,
                errorMessage: "IMDB Rating must be a number"
            }
        }

        const isOK = newValue >= 1 && newValue <= 10;
        if (isOK) return true;

        return {
            error: true,
            errorMessage: "IMDB Rating must be between 1 and 10"
        }
    },
    imdbVotes: (value) => {
        const newValue = Number(value);
        if (typeof newValue !== 'number') {
            return {
                error: true,
                errorMessage: "IMDB Votes must be a number"
            }
        }
    
        const isOK = newValue >= 1;
        if (isOK) return true;

        return {
            error: true,
            errorMessage: "IMDB Votes must be greater than 1"
        }
    }
}

const validateField = (fieldName, fieldValue) => {
    const validateMethod = validateMethods[fieldName];
    if (validateMethod === undefined) {
        return {
            error: true,
            errorMessage: "Could not validate field"
        }
    }

    return validateMethod(fieldValue);
}

const validateFormData = (formData) => {
    const fieldNames = Object.keys(formData);
    const errors = {};
    let allValid = true
    fieldNames.forEach(field => {
        const validationResult = validateField(field, formData[field]);

        if (validationResult !== true) {
            errors[field] = validationResult.errorMessage;
            allValid = false
        }
    });

    return allValid === true ? true : errors;
}

const validatePoster = async (fileContents) => {
    let image = undefined;
    try {
        image = sharp(fileContents);
    } catch (e) {
        return {
            error: true,
            errorMessage: "Invalid file format"
        };
    }
    
    const imageData = await image.metadata();
    if (imageData.width > 480 && imageData.height > imageData.width + 100) {
        return true;
    } else {
        return {
            error: true,
            errorMessage: "Movie poster must be at least 480 pixels wide and 580 pixels tall"
        }
    }
}

module.exports = {
    validateFormData,
    validatePoster
};