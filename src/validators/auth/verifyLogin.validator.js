import joi from "joi";

import { loginMethods, riskLevel } from "../../constants/auth.constant.js";

export const verifyLoginValidator = joi.object({
    ctxId: joi.string().min(31).max(33).required().messages({
        "any.required": "ctx id is required.",
        "string.empty": "ctc id cannot be empty."
    }),
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
    remember: joi.boolean().valid(true, false).required().messages({
        "any.only": "Invalid remember type only allowed true or false.",
        "any.required": "remember is required."
    })
});
