import Joi from "joi";

export const verifyPaymentValidator = Joi.object({
    type: Joi.string()
        .valid(
            "PAYMENT_SUCCESS",
            "PAYMENT_FAILED",
            "SUBSCRIPTION_AUTHORIZED",
            "SUBSCRIPTION_ACTIVATED",
            "SUBSCRIPTION_CHARGED",
            "SUBSCRIPTION_PAYMENT_FAILED",
            "SUBSCRIPTION_PAUSED",
            "SUBSCRIPTION_CANCELLED"
        )
        .required(),

    data: Joi.object({
        payment: Joi.object({
            cf_payment_id: Joi.string().required(),
            order_id: Joi.string().required(),
            payment_amount: Joi.number().positive().required(),
            payment_currency: Joi.string().length(3).required(),
            payment_status: Joi.string().valid("SUCCESS", "FAILED").required(),
            payment_method: Joi.string().required(),
            payment_time: Joi.string().required(),
            error_code: Joi.string().allow(null),
            error_description: Joi.string().allow(null)
        }).optional(),

        subscription: Joi.object({
            subscription_id: Joi.string().required(),
            subscription_status: Joi.string()
                .valid("ACTIVE", "PAUSED", "CANCELLED", "EXPIRED")
                .required(),
            plan_id: Joi.string().optional(),
            next_charge_time: Joi.string().optional(),
            current_period_start: Joi.string().optional(),
            current_period_end: Joi.string().optional()
        }).optional()
    }).required()
}).options({
    allowUnknown: true,
    stripUnknown: false
});
