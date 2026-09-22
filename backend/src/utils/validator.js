const validator = require("validator");

const validate = (data) => {
    const mandatoryFields = ['firstName', 'emailId', 'password'];

    // All mandatory fields check
    const isAllowed = mandatoryFields.every((field) => Object.keys(data).includes(field) && data[field]?.trim() !== '');

    if (!isAllowed) {
        throw new Error("Some fields are missing or empty");
    }

    if (!validator.isEmail(data.emailId)) {
        throw new Error("Invalid Email Address");
    }

    // Optional: Strong password validation enable karne ke liye uncomment karein
    // if (!validator.isStrongPassword(data.password)) {
    //     throw new Error("Password is weak (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol required)");
    // }
};

module.exports = validate;