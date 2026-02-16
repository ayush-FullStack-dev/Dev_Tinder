import Joi from "joi";

export const verifyPaymentValidator = Joi.object({
    event: Joi.string().valid("payment.captured", "payment.failed").required(),

    payload: Joi.object({
        payment: Joi.object({
            entity: Joi.object({
                id: Joi.string().required(),
                order_id: Joi.string().required(),
                amount: Joi.number().integer().positive().required(),
                currency: Joi.string().length(3).required(),

                status: Joi.when("method", {
                    is: "upi",
                    then: Joi.string().valid("captured", "failed").required(),
                    otherwise: Joi.string()
                        .valid("authorized", "captured", "failed")
                        .required()
                }),

                method: Joi.string()
                    .valid("upi", "card", "netbanking", "wallet")
                    .required(),

                captured: Joi.boolean().optional(),
                created_at: Joi.number().integer().required(),

                error_code: Joi.when("status", {
                    is: "failed",
                    then: Joi.string().required(),
                    otherwise: Joi.forbidden()
                }),

                error_description: Joi.when("status", {
                    is: "failed",
                    then: Joi.string().required(),
                    otherwise: Joi.forbidden()
                })
            }).required()
        }).required()
    }).required()
}).options({
    allowUnknown: true,
    stripUnknown: false
});
