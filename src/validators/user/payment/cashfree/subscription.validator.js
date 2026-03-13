import Joi from "joi";

export const subscriptionValidator = Joi.object({
    type: Joi.string().required(),

    event_time: Joi.string().isoDate().required(),

    data: Joi.object({
        subscription_id: Joi.string().optional(),
        cf_subscription_id: Joi.string().optional(),

        payment_id: Joi.string().optional(),
        cf_payment_id: Joi.string().optional(),
        cf_txn_id: Joi.string().allow(null).optional(),
        cf_order_id: Joi.alternatives()
            .try(Joi.string(), Joi.number())
            .optional(),

        payment_type: Joi.string().optional(),

        payment_amount: Joi.number().optional(),

        payment_status: Joi.string().optional(),

        payment_schedule_date: Joi.string().optional(),

        payment_initiated_date: Joi.string().optional(),

        payment_remarks: Joi.string().allow(null).optional(),

        retry_attempts: Joi.number().optional(),

        failureDetails: Joi.object({
            failureReason: Joi.string().optional()
        })
            .allow(null)
            .optional(),

        authorization_details: Joi.object({
            authorization_amount: Joi.number().optional(),
            authorization_amount_refund: Joi.boolean().optional(),
            approve_by_time: Joi.string().allow("").optional(),
            authorization_reference: Joi.string().allow(null).optional(),
            authorization_time: Joi.string().allow("").optional(),
            authorization_status: Joi.string().optional(),
            payment_id: Joi.string().optional(),
            payment_method: Joi.string().optional(),
            instrument_id: Joi.string().optional()
        }).optional(),

        payment_gateway_details: Joi.object({
            gateway_name: Joi.string().optional(),
            gateway_subscription_id: Joi.string().optional(),
            gateway_payment_id: Joi.string().optional()
        }).optional()
    }).required()
}).options({
    allowUnknown: true
});
