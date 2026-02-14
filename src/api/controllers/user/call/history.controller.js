import sendResponse from "../../../../helpers/sendResponse.js";

import Call from "../../../../models/Call.model.js";
import Message from "../../../../models/Message.model.js";
import redis from "../../../../config/redis.js";

export const deleteCallLogs = async (req, res) => {
    const { currentProfile } = req.auth;
    const chatIds = [];
    const query = {
        $or: [
            { callerId: currentProfile._id },
            { receiverId: currentProfile._id }
        ],
        status: {
            $nin: ["calling", "ringing", "ongoing"]
        }
    };

    const calls = await Call.find(query);
    const deleteCalls = await Call.deleteMany(query);

    for (const call of calls) {
        chatIds.push(call._id);
    }

    await Message.updateMany(
        {
            type: "system",
            "system.event": "call",
            chatId: {
                $in: chatIds
            }
        },
        {
            deletedForEveryoneAt: new Date()
        }
    );

    return sendResponse(res, 200, {
        success: true,
        message: "Call history cleared successfully"
    });
};

export const deleteSpecifyCall = async (req, res) => {
    const { currentProfile } = req.auth;
    const { callId } = req.params;

    const call = await Call.findOneAndDelete({
        _id: callId,
        $or: [
            { callerId: currentProfile._id },
            { receiverId: currentProfile._id }
        ],
        status: {
            $nin: ["calling", "ringing", "ongoing"]
        }
    })

    if (!call) {
        return sendResponse(res, 404, {
            code: "CALL_NOT_FOUND",
            message: "Call does not exist or you no longer have access"
        });
    }

    await Message.deleteOne(
        {
            chatId: call.chatId,
            type: "system",
            "system.event": "call",
            "system.call.callId": call._id
        },
        {
            deletedForEveryoneAt: new Date()
        }
    );

    return sendResponse(res, 200, {
        success: true,
        message: "Call deleted successfully",
        data: {
            callId: call._id
        }
    });
};
