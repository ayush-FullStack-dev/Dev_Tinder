import sendResponse from "../../../helpers/sendResponse.js";

import { findAuthEvent } from "../../../services/authEvent.service.js";
import { buildDeviceInfo } from "../../../helpers/buildDeviceInfo.js";
import AuthEvent from "../../../models/AuthEvent.model.js";

export const securityEventHandler = async (req, res) => {
    const { user } = req.auth;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);

    
    const query = {
        userId: user._id
    };

    if (req.query.types) {
        if (!Array.isArray(req.query.types)) {
            req.query.types = [req.query.types];
        }

        query.eventType = { $in: req.query.types };
    }

    const [total, logs] = await Promise.all([
        AuthEvent.countDocuments(query),
        AuthEvent.find(query)
            .limit(limit)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
    ]);

    const events = [];

    for (const log of logs) {
        const info = buildDeviceInfo(log.userAgent);
        events.push({
            eventId: log.id,
            eventType: log.eventType,
            action: log.action,
            success: log.success,
            risk: log.risk,
            platform: log.platform,
            loginMethod: log.loginMethod,
            mfaUsed: log.mfaUsed,
            location: {
                country: log.ipCountry,
                city: log.ipCity
            },
            device: info.deviceName,
            model: info.deviceModel,
            createdAt: log.createdAt,
            reason: log.reason
        });
    }

    return sendResponse(res, 200, {
        meta: {
            page,
            limit,
            totalEvents: total,
            totalPages: Math.ceil(total / limit)
        },
        events
    });
};
