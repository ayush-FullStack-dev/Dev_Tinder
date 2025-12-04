import { signupValidators } from "../api/validators/auth.js";
import { findUser } from "../api/services/auth.js";

export const signupValidation = async (req, res, next) => {
    req.body.gender = req.body.gender || "male";
    req.body.role = "user";
    const validateError = signupValidators.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: false
    });
    if (validateError.error) {
        const jsonResponse = {
            success: false,
            message: "vaildation failed for register",
            errors: []
        };
        for (let err of validateError.error.details) {
            jsonResponse.errors.push({
                type: err.path[0],
                message: err.message
            });
        }
        return res.status(401).json(jsonResponse);
    }

    const emailExist = await findUser({
        email: req.body.email
    });

    if (emailExist && emailExist.username === req.body.username) {
        return res.status(401).json({
            success: false,
            message: `${emailExist.email} email && ${emailExist.username} is already taken use different email && username to signup`
        });
    } else if (emailExist) {
        return res.status(401).json({
            success: false,
            message: `${req.body.email} email is already taken use different email to signup`
        });
    }

    const usernameExist = await findUser({
        username: req.body.username
    });

    if (usernameExist) {
        return res.status(401).json({
            success: false,
            message: `${usernameExist.username} username is already taken use different username to signup`
        });
    }

    if (req.body.email === process.env.ADMIN_MAIL) {
        req.body.role = "admin";
    }
    return next();
};
