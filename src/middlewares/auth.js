import { signupValidators, loginValidators } from "../api/validators/auth.js";
import { findUser } from "../api/services/auth.js";

import { sendResponse } from "../helpers/helpers.js";

const joiOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: false
};
export const signupValidation = async (req, res, next) => {
    req.body.gender = req.body.gender || "male";
    req.body.role = "user";
    const validateError = signupValidators.validate(req.body, joiOptions);
    if (validateError.error) {
        const jsonResponse = {
            message: "vaildation failed for register",
            errors: []
        };
        for (let err of validateError.error.details) {
            jsonResponse.errors.push({
                type: err.path[0],
                message: err.message
            });
        }
        return sendResponse(res, 401, jsonResponse);
    }

    const emailExist = await findUser({
        email: req.body.email
    });

    if (emailExist && emailExist.username === req.body.username) {
        return sendResponse(res, 401, {
            message: `${emailExist.email} email && ${emailExist.username} is already taken use different email && username to signup`
        });
    } else if (emailExist) {
        return sendResponse(res, 401, {
            message: `${req.body.email} email is already taken use different email to signup`
        });
    }

    const usernameExist = await findUser({
        username: req.body.username
    });

    if (usernameExist) {
        return sendResponse(res, 401, {
            message: `${usernameExist.username} username is already taken use different username to signup`
        });
    }

    if (req.body.email === process.env.ADMIN_MAIL) {
        req.body.role = "admin";
    }
    return next();
};

export const loginValidation = (req, res, next) => {
    const { email, username } = req.body;
    const validate = loginValidators.validate(req.body, joiOptions);

    if (validate.error) {
        const jsonResponse = {
            message: "vaildation failed for login",
            errors: []
        };
        for (let err of validate.error.details) {
            jsonResponse.errors.push({
                type: err.path[0],
                message: err.message
            });
        }
        return sendResponse(res, 401, jsonResponse);
    }
    if (email) {
        res.locals.login = email;
        res.locals.fieldName = "email";
    } else {
        res.locals.login = username;
        res.locals.fieldName = "username";
    }
    res.locals.password = validate.value.password;
    next();
};
