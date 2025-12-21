import sendResponse from "../../../helpers/sendResponse.js";

import { getTime } from "../../../helpers/helpers.js";

export const sessionHandler = (req, res) => {
    const { user, findedCurrent } = req.auth;
    const validSessions = [];

    const activeSessions = user.refreshToken.filter(s => s.version === 1);

    for (const session of activeSessions) {
        const createdAt = getTime(session.createdAt).fullTime.readable;
        const lastActive = getTime(session.lastActive).fullTime.readable;
        const obj = {
            id: "s_" + session.ctxId.slice(-8),
            device: {
                name: session.deviceName,
                type: session.deviceType
            },
            location: {
                country: session.country,
                city: session.city
            },
            login: {
                method: session.loginContext.primary.method,
                mfa: session.loginContext.mfa.required
            },
            trust: {
                trusted: session.loginContext.trust.deviceTrusted,
                level: session.loginContext.trust.sessionLevel
            },
            activity: {
                createdAt,
                lastActive
            }
        };
        if (session.ctxId === findedCurrent.ctxId) {
            obj.current = true;
        }
        validSessions.push(obj);
    }

    return sendResponse(res, 200, {
        message: "All session fetched successfully",
        sessions: validSessions
    });
};

export const sessionRevokeHandler = async (req, res) => {
    const { user, findedCurrent } = req.auth;
    const id = req.params?.id?.slice(2);

    if (!id || id.length !== 8) {
        return sendResponse(res, 400, {
            message: "please provide a valid masked session id to revoke"
        });
    }

    const tokenIndex = user.refreshToken.findIndex(t => t.ctxId.endsWith(id));
    const findSession = user.refreshToken[tokenIndex];

    if (!findSession) {
        return sendResponse(res, 404, {
            message: "Session not found"
        });
    }

    if (findSession.ctxId === findedCurrent.ctxId) {
        return sendResponse(res, 401, {
            message: "You can’t revoke your current session"
        });
    }

    req.auth = {
        ...req.auth,
        tokenIndex,
        device: findSession,
        reason: "revoked_by_user",
        action: "session-revoke"
    };

    await logoutCurrentSession(req, null);

    return sendResponse(res, 200, {
        revoked: true,
        message: "Session has been signed out"
    });
};
