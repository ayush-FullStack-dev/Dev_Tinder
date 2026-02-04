import Joi from "joi";

export const newMessageValidator = Joi.object({
    type: Joi.string()
        .valid("text", "image", "video", "audio", "file")
        .required()
        .messages({
            "any.required": "Message type is required",
            "any.only": "Invalid message type"
        }),

    text: Joi.string()
        .trim()
        .max(4000)
        .allow(null, "")
        .when("type", {
            is: "text",
            then: Joi.string().trim().min(1).max(4000).required().messages({
                "any.required": "Message text is required",
                "string.empty": "Message text cannot be empty",
                "string.min": "Message text cannot be empty",
                "string.max": "Message text is too long (max 4000 chars)"
            }),
            otherwise: Joi.forbidden().messages({
                "any.unknown": "Text is only allowed for text messages"
            })
        }),

    forwarded: Joi.object({
        
        originalMessageId: Joi.string().required().length(24).hex().messages({
            "string.length": "Invalid originalMessageId format",
            "string.hex": "Invalid originalMessageId  format",
            "any.required": "originalMessageId is required"
        })
    }).allow(null),
    media: Joi.object({
        key: Joi.string().trim().required().messages({
            "any.required": "media.key is required",
            "string.empty": "media.key cannot be empty"
        }),

        url: Joi.string().uri().required().messages({
            "any.required": "media.url is required",
            "string.uri": "media.url must be a valid URL"
        }),

        mimeType: Joi.string().trim().required().messages({
            "any.required": "media.mimeType is required"
        }),

        size: Joi.number()
            .integer()
            .min(1)
            .max(50 * 1024 * 1024)
            .required()
            .messages({
                "any.required": "media.size is required",
                "number.base": "media.size must be a number",
                "number.min": "media.size must be greater than 0",
                "number.max": "media.size too large (max 50MB)"
            }),

        name: Joi.string().trim().max(200).allow(null, "").messages({
            "string.max": "media.name too long"
        }),

        duration: Joi.number()
            .min(0)
            .max(60 * 60)
            .allow(null)
            .messages({
                "number.base": "media.duration must be a number",
                "number.max": "media.duration too long"
            }),

        width: Joi.number().integer().min(1).max(10000).allow(null).messages({
            "number.base": "media.width must be a number"
        }),

        height: Joi.number().integer().min(1).max(10000).allow(null).messages({
            "number.base": "media.height must be a number"
        })
    })
        .allow(null)
        .when("type", {
            is: "text",
            then: Joi.forbidden().messages({
                "any.unknown": "media is not allowed for text messages"
            }),
            otherwise: Joi.required().messages({
                "any.required": "media is required for non-text messages"
            })
        }),

    replyTo: Joi.string().length(24).hex().allow(null).messages({
        "string.length": "Invalid replyTo messageId format",
        "string.hex": "Invalid replyTo messageId format"
    })
}).options({
    abortEarly: true,
    allowUnknown: false
});

export const editMessageValidator = Joi.object({
    messageId: Joi.string()
        .length(24)
        .hex()
        .required()
        .messages({
            "any.required": "messageId is required",
            "string.length": "Invalid messageId format",
            "string.hex": "Invalid messageId format"
        }),

    text: Joi.string()
        .trim()
        .min(1)
        .max(4000)
        .required()
        .messages({
            "any.required": "Message text is required",
            "string.empty": "Message text cannot be empty",
            "string.min": "Message text cannot be empty",
            "string.max": "Message text is too long (max 4000 chars)"
        }),

    // Hard block unwanted edits
    type: Joi.forbidden().messages({
        "any.unknown": "Message type cannot be edited"
    }),

    media: Joi.forbidden().messages({
        "any.unknown": "Media cannot be edited"
    }),

    forwarded: Joi.forbidden().messages({
        "any.unknown": "Forwarded data cannot be edited"
    }),

    replyTo: Joi.forbidden().messages({
        "any.unknown": "replyTo cannot be edited"
    })
}).options({
    abortEarly: true,
    allowUnknown: false
});