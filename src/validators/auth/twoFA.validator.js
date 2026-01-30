import joi from "joi";

const twoFAValidators = joi.object({
    email: joi.string().email().required().messages({
        "string.email": "Please enter a valid email."
    }),

    deviceId: joi.string().required().messages({
        "any.required": "deviceId is required.",
        "string.empty": "deviceId cannot be empty."
    }),
    
    deviceSize: joi.number(),
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
