import PaymentOrder from "../../../../../../models/subscription/PaymentOrder.model.js";
import AutoPay from "../../../../../../models/subscription/AutoPay.model.js";
import sendResponse from "../../../../../../helpers/sendResponse.js";

import { refundWebhookSchema } from "../../../../../../validators/user/payment/cashfree/refund.validator.js";

import { checkValidation } from "../../../../../../helpers/helpers.js";

export const validateRefundBody = (req, res, next) => {
  const validate = refundWebhookSchema.validate(req.body);

  if (validate.error) {
    console.log("refundWebhookValidationError", validate.error);
    return sendResponse(res, 400);
  }

  req.auth = { ...req.auth, value: validate.value };
  return next();
};

export const handleRefundWebhook = async (req, res) => {
  const { type, data } = req.auth.value;
  console.log("starting refund procccessing", data);
  const isRefundStatusWebhook = type === "REFUND_STATUS_WEBHOOK";
  const isAutoRefundStatusWebhook = type === "AUTO_REFUND_STATUS_WEBHOOK";

  if (!isRefundStatusWebhook && !isAutoRefundStatusWebhook) {
    return sendResponse(res, 400);
  }

  console.log("isRefundStatusWebhook", isRefundStatusWebhook);
  console.log("isAutoRefundStatusWebhook", isAutoRefundStatusWebhook);

  const refundData = isRefundStatusWebhook ? data.refund : data.auto_refund;

  const refundStatus =
    refundData.refund_status === "SUCCESS" ? "refunded" : "refund_failed";

  await PaymentOrder.findOneAndUpdate(
    { refund_id: refundData.refund_id },
    { $set: { status: refundStatus, refundedAt: new Date() } },
  );

  console.log("refund process completed", refundStatus);

  return sendResponse(res, 200);
};

export const handleRefundAutoPayWebhook = async (req, res) => {
  const { type, data: refundData } = req.auth.value;
  console.log("starting refund procccessing", refundData);

  const isSubscriptionRefundStatusWebhook =
    type === "SUBSCRIPTION_REFUND_STATUS";

  console.log(
    "isSubscriptionRefundStatusWebhook",
    isSubscriptionRefundStatusWebhook,
  );

  if (!isSubscriptionRefundStatusWebhook) {
    return sendResponse(res, 400);
  }

  const refundStatus =
    refundData.refund_status === "SUCCESS" ? "refunded" : "refund_failed";

  await AutoPay.findOneAndUpdate(
    { refundId: refundData.refund_id },
    { $set: { status: refundStatus, refundedAt: new Date() } },
  );

  console.log("refund process completed", refundStatus);

  return sendResponse(res, 200);
};
