import Joi from "joi";

export const verifyPaymentValidator = Joi.object({
    event: Joi.string()
        .valid(
            // one-time payment
            "payment.authorized",
            "payment.captured",
            "payment.failed",

            "subscription.authenticated",
            "subscription.activated",
            "subscription.paused",
            "subscription.cancelled",

            
            "invoice.paid",
            "invoice.payment_failed"
        )
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

                error_code: Joi.string().allow(null),
                error_description: Joi.string().allow(null)
            })
        }).optional(),

        subscription: Joi.object({
            entity: Joi.object({
                id: Joi.string().required(),
                plan_id: Joi.string().required(),
                status: Joi.string()
                    .valid(
                        "created",
                        "authenticated",
                        "active",
                        "paused",
                        "cancelled",
                        "expired"
                    )
                    .required(),

                current_start: Joi.number().integer().optional(),
                current_end: Joi.number().integer().optional(),

                charge_at: Joi.number().integer().optional(),
                start_at: Joi.number().integer().optional(),

                total_count: Joi.number().integer().optional(),
                paid_count: Joi.number().integer().optional(),

                customer_notify: Joi.number().valid(0, 1).optional()
            })
        }).optional(),

        invoice: Joi.object({
            entity: Joi.object({
                id: Joi.string().required(), // inv_xxx
                subscription_id: Joi.string().required(), // sub_xxx

                amount: Joi.number().integer().positive().required(),
                currency: Joi.string().length(3).required(),

                status: Joi.string().valid("paid", "failed").required(),

                attempt_count: Joi.number().integer().optional(),
                billing_start: Joi.number().integer().optional(),
                billing_end: Joi.number().integer().optional(),

                paid_at: Joi.number().integer().optional(),
                created_at: Joi.number().integer().required()
            })
        }).optional()
    }).required()
}).options({
    allowUnknown: true,
    stripUnknown: false
});
