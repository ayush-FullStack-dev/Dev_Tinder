import joi from "joi";

import { twoFaMethods } from "../../constants/auth.constant.js";
const verifyTwoFAValidators = joi.object({
    email: joi.string().email().required().messages({
        "string.email": "Please enter a valid email."
    }),

    method: joi
        .string()
        .valid(...twoFaMethods)
        .messages({
            "any.only": "Invalid twoFA method.",
            "any.required": "twoFa method is required."
        })
        .required(),
    deviceId: joi.string().required().messages({
        "any.required": "deviceId is required.",
        "string.empty": "deviceId cannot be empty."
    }),
    code: joi
        .string()
        .pattern(/^\d{6,}$/)
        .required()
        .messages({
            "string.pattern.base": "Code must be minimum 6 digits.",
            "any.required": "Code is required."
        }),
    clientTime: joi.number(),
    trustDevice: joi.boolean().valid(true, false).messages({
        "any.only": "Invalid trustDevice type only allowed true or false."
    }),
    remeberDevice: joi.boolean().valid(true, false).messages({
        "any.only": "Invalid remeberDevice type only allowed true or false."
    }),
    remember: joi.boolean().valid(true, false).required().messages({
        "any.only": "Invalid remember type only allowed true or false.",
        "any.required": "remember is required."
    })
});

export default verifyTwoFAValidators;
