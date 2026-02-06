import sendResponse from "../../../../helpers/sendResponse.js";
import Call from "../../../../models/Call.model.js";

import { paginationInfos } from "../../../../helpers/pagination.helper.js";
import { isValidDate } from "../../../../helpers/time.js";

export const getCalls = async (req, res) => {
    const { currentProfile } = req.auth;

    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const query = {
        $or: [
            { callerId: currentProfile._id },
            { receiverId: currentProfile._id }
        ]
    };

    if (req.query?.cursor) {
        if (!isValidDate(req.query.cursor)) {
            return sendResponse(res, 400, {
                success: false,
                message: "Invalid cursor"
            });
        }
        query.createdAt = { $lt: new Date(req.query.cursor) };
    }

    const calls = await Call.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .populate("callerId receiverId", "displayName primaryPhoto");

    const { pagination, info: callsInfo } = paginationInfos(
        calls,
        limit,
        "createdAt"
    );

    const response = {
        message: "Call history fetched successfully",
        calls: [],
        pagination
    };

    for (const call of callsInfo) {
        const direction =
            String(call.callerId._id) === String(currentProfile._id)
                ? "outgoing"
                : "incoming";
        const caller = call.callerId;
        const receiver = call.receiverId;

        response.calls.push({
            callId: call._id,
            chatId: call.chatId,
            type: call.type,
            status: call.status,
            isActive: call.status === "ongoing",
            direction,
            with:
                direction === "outgoing"
                    ? {
                          userId: receiver._id,
                          name: receiver.displayName,
                          photo: receiver.primaryPhoto.url
                      }
                    : {
                          userId: caller._id,
                          name: caller.displayName,
                          photo: caller.primaryPhoto.url
                      },
            timestamps: {
                startedAt: call.startedAt,
                endedAt: call.endedAt
            },
            duration: call.duration,
            endReason: call.endReason
        });
    }

    return sendResponse(res, 200, response);
};
