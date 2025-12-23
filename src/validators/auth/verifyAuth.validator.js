import joi from "joi";

import { loginMethods, riskLevel } from "../../constants/auth.constant.js";

export const verifyAuthValidator = joi.object({
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
    clientTime: joi.number(),
    deviceSize: joi.number()
});
