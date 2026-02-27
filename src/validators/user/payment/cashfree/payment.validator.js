import Joi from "joi";

export const verifyPaymentValidator = Joi.object({
  type: Joi.string()
    .valid("PAYMENT_SUCCESS_WEBHOOK", "PAYMENT_FAILED_WEBHOOK")
    .required(),

  data: Joi.object({
    order: Joi.object({
      order_id: Joi.string().required(),
      order_amount: Joi.number().required(),
      order_currency: Joi.string().length(3).required()
    }).required(),

    payment: Joi.object({
      cf_payment_id: Joi.string().required(),
      payment_amount: Joi.number().positive().required(),
      payment_currency: Joi.string().length(3).required(),
      payment_status: Joi.string().valid("SUCCESS", "FAILED").required(),
      payment_method: Joi.object().required(),
      payment_time: Joi.string().required(),
      error_code: Joi.any().allow(null),
      error_description: Joi.any().allow(null)
    }).required()
  }).required()
}).options({
  allowUnknown: true
});