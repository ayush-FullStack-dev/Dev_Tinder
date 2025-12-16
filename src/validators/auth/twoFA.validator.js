import joi from "joi";

const twoFAValidators = joi.object({
    email: joi.string().email().required().messages({
        "string.email": "Please enter a valid email."
    }),
    ctxId: joi.string().min(31).max(33).required().messages({
        "any.required": "ctx id is required.",
        "string.empty": "ctc id cannot be empty."
    }),

    password: joi.string().min(1).messages({
        "string.empty": "Password cannot be empty."
    }),

    deviceId: joi.string().required().messages({
        "any.required": "deviceId is required.",
        "string.empty": "deviceId cannot be empty."
    }),
    deviceSize: joi.number().required().messages({
        "any.required": "deviceSize is required."
    }),
    method: joi
        .string()
        .required()
        .valid("EMAIL", "TOTP", "BACKUPCODE")
        .messages({
            "any.only": "Invalid twoFA method.",
            "any.required": "verify method is required."
        }),
    remember: joi.boolean().valid(true, false).required().messages({
        "any.only": "Invalid remember type only allowed true or false.",
        "any.required": "remember is required."
    })
});

export default twoFAValidators;
