import Joi from "joi";

export const verifyPaymentValidator = Joi.object({
    event: Joi.string()
        .valid("payment.authorized", "payment.captured", "payment.failed")
        .required(),

    payload: Joi.object({
        payment: Joi.object({
            entity: Joi.object({
                id: Joi.string().required(),
                order_id: Joi.string().allow(null),
                amount: Joi.number().integer().positive().required(),
                currency: Joi.string().length(3).required(),

                status: Joi.string()
                    .valid("authorized", "captured", "failed")
                    .required(),

                method: Joi.string()
                    .valid("upi", "card", "netbanking", "wallet", "emi")
                    .required(),

                captured: Joi.boolean().optional(),
                created_at: Joi.number().integer().required(),

                error_code: Joi.string().allow(null).optional(),
                error_description: Joi.string().allow(null).optional()
            }).required()
        }).required()
    }).required()
}).options({
    allowUnknown: true,
    stripUnknown: false
});
