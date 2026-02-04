import Joi from "joi";

export const reactionValidator = Joi.object({
    emoji: Joi.string().min(1).max(10).required().messages({
        "string.base": "Emoji must be a string",
        "string.empty": "Emoji is required"
    }),
    messageId: Joi.string().required().length(24).hex().messages({
        "string.length": "Invalid messageId format",
        "string.hex": "Invalid messageId  format",
        "any.required": "messageId is required"
    })
}).options({
    abortEarly: true,
    allowUnknown: false
});

export const unreactValidator = Joi.object({
    emoji: Joi.string().min(1).max(10).messages({
        "string.base": "Emoji must be a string",
        "string.empty": "Emoji is required"
    }),
    messageId: Joi.string().required().length(24).hex().messages({
        "string.length": "Invalid messageId format",
        "string.hex": "Invalid messageId  format",
        "any.required": "messageId is required"
    })
}).options({
    abortEarly: true,
    allowUnknown: false
});
