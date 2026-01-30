import joi from "joi";

export const loginValidator = joi
    .object({
        username: joi.string().messages({
            "string.base": "Username must be a valid string."
        }),

        email: joi.string().email().messages({
            "string.email": "Please enter a valid email."
        }),

        password: joi.string().min(1).required().messages({
            "any.required": "Password is required.",
            "string.empty": "Password cannot be empty."
        }),
        deviceId: joi.string().required().messages({
            "any.required": "deviceId is required.",
            "string.empty": "deviceId cannot be empty."
        }),

        deviceSize: joi.number().required().messages({
            "any.required": "deviceSize is required."
        }),
        remember: joi.boolean().valid(true, false).required().messages({
            "any.only": "Invalid remember type only allowed true or false.",
            "any.required": "remember is required."
        })
    })
    .or("username", "email")
    .messages({
        "object.missing": "Either username or email is required."
    });

export const loginIdentifyValidator = joi
    .object({
        username: joi.string().messages({
            "string.base": "Username must be a valid string."
        }),

        email: joi.string().email().messages({
            "string.email": "Please enter a valid email."
        }),
        deviceId: joi.string().required().messages({
            "any.required": "deviceId is required.",
            "string.empty": "deviceId cannot be empty."
        }),

        deviceSize: joi.number().required().messages({
            "any.required": "deviceSize is required."
        })
    })
    .or("username", "email")
    .messages({
        "object.missing": "Either username or email is required."
    });
