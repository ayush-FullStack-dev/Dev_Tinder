import joi from "joi";

export const subscribeValidator = joi.object({
    deviceId: joi.string().required().messages({
        "any.required": "deviceId is required.",
        "string.empty": "deviceId cannot be empty."
    }),
    subscription: joi
        .object({
            endpoint: joi.string().required().messages({
                "any.required": "endpoint url is required.",
                "string.empty": "endpoint url cannot be empty."
            }),
            keys: joi
                .object({
                    p256dh: joi.string().required().messages({
                        "any.required": "p256dh key is required.",
                        "string.empty": "p256dh key cannot be empty."
                    }),
                    auth: joi.string().required().messages({
                        "any.required": "auth key is required.",
                        "string.empty": "auth key cannot be empty."
                    })
                })
                .required()
                .messages({
                    "any.required": "keys is required."
                })
        })
        .required()
        .messages({
            "any.required": "subscription is required.",
        })
});
