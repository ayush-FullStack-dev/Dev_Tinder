import Joi from "joi";

export const subscriptionValidator = Joi.object({
    type: Joi.string()
        .valid(
            "SUBSCRIPTION_STATUS_CHANGED",
            "SUBSCRIPTION_AUTH_STATUS",
            "SUBSCRIPTION_PAYMENT_SUCCESS",
            "SUBSCRIPTION_PAYMENT_FAILED",
            "SUBSCRIPTION_PAYMENT_CANCELLED"
        )
        .required(),

    event_time: Joi.string().isoDate().required(),

    data: Joi.object({
        subscription_id: Joi.string().optional(),
        cf_subscription_id: Joi.alternatives()
            .try(Joi.string(), Joi.number())
            .optional(),

        payment_id: Joi.string().optional(),
        cf_payment_id: Joi.alternatives()
            .try(Joi.string(), Joi.number())
            .optional(),
        cf_txn_id: Joi.alternatives()
            .try(Joi.string(), Joi.number())
            .allow(null)
            .optional(),
        cf_order_id: Joi.alternatives()
            .try(Joi.string(), Joi.number())
            .allow("")
            .optional(),

        payment_type: Joi.string().optional(),

        payment_amount: Joi.number().optional(),
        payment_currency: Joi.string().optional(),
        payment_status: Joi.string().optional(),

        payment_schedule_date: Joi.string().allow("").optional(),
        payment_initiated_date: Joi.string().allow("").optional(),

        payment_remarks: Joi.string().allow(null, "").optional(),

        retry_attempts: Joi.number().optional(),

        failure_details: Joi.object({
            failure_reason: Joi.string().allow(null).optional()
        })
            .allow(null)
            .optional(),

        authorization_details: Joi.object({
            authorization_amount: Joi.number().optional(),
            authorization_amount_refund: Joi.boolean().optional(),

            approve_by_time: Joi.string().allow("").optional(),

            authorization_reference: Joi.string().allow(null).optional(),

            authorization_time: Joi.string().allow("").optional(),

            authorization_status: Joi.string().allow(null).optional(),

            payment_id: Joi.string().optional(),

            payment_method: Joi.object().allow(null).optional(),

            payment_group: Joi.string().allow(null).optional(),

            instrument_id: Joi.string().optional()
        })
            .allow(null)
            .optional(),

        subscription_details: Joi.object({
            cf_subscription_id: Joi.alternatives()
                .try(Joi.string(), Joi.number())
                .optional(),
            subscription_id: Joi.string().optional(),
            subscription_status: Joi.string().optional(),
            subscription_expiry_time: Joi.string().allow(null).optional(),
            subscription_first_charge_time: Joi.string().allow(null).optional(),
            subscription_tags: Joi.any().allow(null).optional(),
            next_schedule_date: Joi.string().allow(null).optional()
        }).optional(),

        customer_details: Joi.object({
            customer_name: Joi.string().allow(null).optional(),
            customer_email: Joi.string().email().optional(),
            customer_phone: Joi.string().optional()
        }).optional(),

        plan_details: Joi.object({
            plan_id: Joi.string().optional(),
            plan_name: Joi.string().optional(),
            plan_type: Joi.string().optional(),
            plan_max_cycles: Joi.number().optional(),
            plan_recurring_amount: Joi.number().allow(null).optional(),
            plan_max_amount: Joi.number().optional(),
            plan_interval_type: Joi.string().allow(null).optional(),
            plan_intervals: Joi.number().allow(null).optional(),
            plan_currency: Joi.string().optional(),
            plan_note: Joi.string().allow(null).optional(),
            plan_status: Joi.string().allow(null).optional()
        }).optional(),

        payment_gateway_details: Joi.object({
            gateway_name: Joi.string().optional(),
            gateway_subscription_id: Joi.alternatives()
                .try(Joi.string(), Joi.number())
                .optional(),
            gateway_payment_id: Joi.alternatives()
                .try(Joi.string(), Joi.number())
                .optional(),
            gateway_plan_id: Joi.string().optional(),
            gateway_auth_id: Joi.string().optional()
        }).optional()
    }).required()
}).options({
    allowUnknown: true
});
