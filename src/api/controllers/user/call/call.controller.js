import sendResponse from "../../../../helpers/sendResponse.js";
import Call from "../../../../models/Call.model.js";
import redis from "../../../../config/redis.js";

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

export const getSpecifyCall = async (req, res) => {
    const { currentProfile } = req.auth;
    const { callId } = req.params;

    const call = await Call.findById(callId).populate(
        "callerId receiverId",
        "displayName primaryPhoto"
    );

    if (!call) {
        return sendResponse(res, 404, {
            code: "CALL_NOT_FOUND",
            message: "Call does not exist or you no longer have access"
        });
    }

    const isMemmber =
        String(call.callerId) === String(currentProfile._id) ||
        String(call.receiverId) === String(currentProfile._id);

    if (!isMemmber) {
        return sendResponse(res, 404, {
            code: "MESSAGE_NOT_FOUND",
            message: "Message does not exist or you no longer have access"
        });
    }

    const direction =
        String(call.callerId._id) === String(currentProfile._id)
            ? "outgoing"
            : "incoming";

    const caller = call.callerId;
    const receiver = call.receiverId;
    const isCalling =
        direction === "outgoing" &&
        ["calling", "ringing"].includes(call.status);

    const disconnectInfo = await redis.hgetall(`call:${call._id}`);
    let remaining = 0;

    if (disconnectInfo) {
        const disconnectTime = new Date(disconnectInfo?.disconnectAt).getTime();
        const diffInSeconds = Math.floor((Date.now() - disconnectTime) / 1000);

        const GRACE = 20;
        remaining = Math.max(0, GRACE - diffInSeconds);
    }

    return sendResponse(res, 200, {
        call: {
            callId: call._id,
            chatId: chat._id,
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
            participants: {
                caller: {
                    userId: caller._id,
                    name: caller.displayName,
                    photo: caller.primaryPhoto.url
                },
                receiver: {
                    userId: receiver._id,
                    name: receiver.displayName,
                    photo: receiver.primaryPhoto.url
                }
            },
            media: {
                audio: true,
                video: call.type === "video"
            },
            timestamps: {
                createdAt: call.createdAt,
                startedAt: call.startedAt,
                endedAt: call.endedAt
            },
            duration: call.duration,
            endReason: call.endReason,
            connection: {
                canAccept: isCalling,
                canReject: isCalling,
                canReconnect: remaining > 0,
                resumeWebRTC: remaining > 0,
                gracePeriod: remaining || 0
            }
        }
    });
};
