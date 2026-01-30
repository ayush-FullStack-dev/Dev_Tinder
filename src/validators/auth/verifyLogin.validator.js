import joi from "joi";

import { loginMethods, riskLevel } from "../../constants/auth.constant.js";

export const verifyLoginValidator = joi.object({
    id: joi.string(),
    risk: joi
        .string()
        .valid(...riskLevel)
        .required()
        .messages({
            "any.required": "risk is required."
        }),
    method: joi
        .string()
        .required(...loginMethods)
        .valid(),
    code: joi.string().min(1),
    deviceId: joi.string().required().messages({
        "any.required": "deviceId is required.",
        "string.empty": "deviceId cannot be empty."
    }),
    
    deviceSize: joi.number(),
    remember: joi.boolean().valid(true, false).required().messages({
        "any.only": "Invalid remember type only allowed true or false.",
        "any.required": "remember is required."
    })
});
