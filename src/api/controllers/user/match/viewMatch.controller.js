import sendResponse from "../../../../helpers/sendResponse.js";
import Match from "../../../../models/Match.model.js";

import {
    getBadges,
    buildSubscriptionInfo
} from "../../../../helpers/premium.helper.js";
import { paginationInfos } from "../../../../helpers/pagination.helper.js";
import { isValidDate } from "../../../../helpers/time.js";

export const getMatched = async (req, res) => {
    const { currentProfile } = req.auth;
    const limit = Math.min(Number(req.query.limit) || 10, 40);
    const query = {
        users: currentProfile._id
    };
    const sort = {
        createdAt: -1,
        _id: -1,
        lastMessageAt: -1
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

    const matchDocs = await Match.find(query)
        .sort(sort)
        .limit(limit + 1)
        .populate({
            path: "users",
            select: "username visibility displayName role premium primaryPhoto"
        });

    const { pagination, info } = paginationInfos(matchDocs, limit, "createdAt");
    const response = {
        matches: [],
        pagination
    };

    for (const matchDoc of info) {
        const opponent = matchDoc.users.find(
            u => String(u._id) !== String(currentProfile._id)
        );

        if (opponent.visibility !== "public" || matchDoc.status === "blocked") {
            continue;
        }

        response.matches.push({
            matchId: matchDoc._id,
            status: matchDoc.status,
            user: {
                username: opponent.username,
                primaryPhoto: opponent.primaryPhoto,
                displayName: opponent.displayName,
                role: opponent.role,
                badges: getBadges(opponent.premium)
            },
            createdAt: matchDoc.createdAt,
            lastMessageAt: matchDoc.lastMessageAt
        });
    }

    return sendResponse(res, 200, response);
};

export const getSpecificMatch = async (req, res) => {
    const { currentProfile } = req.auth;
    const premiumInfo = buildSubscriptionInfo(currentProfile.premium);

    if (req.params?.matchId?.length !== 24) {
        return sendResponse(res, 400, {
            message: "Invalid match id format",
            code: "INVALID_MATCH_ID",
            hint: "matchId must be a 24-character MongoDB ObjectId"
        });
    }

    const matchDoc = await Match.findOne({
        _id: req.params?.matchId
    }).populate({
        path: "users unmatchedBy",
        select: "username displayName visibility bio role tech_stack location premium photos primaryPhoto"
    });

    if (!matchDoc) {
        return sendResponse(res, 404, {
            message: "Match not found",
            code: "MATCH_NOT_FOUND"
        });
    }

    const isMember = matchDoc.users.some(
        u => String(u._id) === String(currentProfile._id)
    );

    if (!isMember) {
        return sendResponse(res, 403, {
            message: "You are not allowed to access this match",
            code: "MATCH_FORBIDDEN"
        });
    }

    const opponent = matchDoc.users.find(
        u => String(u._id) !== String(currentProfile._id)
    );

    if (opponent.visibility !== "public" || matchDoc.status === "blocked") {
        return sendResponse(res, 410, {
            message: "This match is no longer active",
            code: "MATCH_CLOSED",
            data: {
                status: "unmatched"
            }
        });
    }

    if (matchDoc.status === "unmatched") {
        const isSelf =
            matchDoc.unmatchedBy &&
            String(matchDoc.unmatchedBy._id) === String(currentProfile._id);

        return sendResponse(res, 410, {
            message: "This match is no longer active",
            code: "MATCH_CLOSED",
            data: {
                status: "unmatched",
                unmatchedAt: matchDoc.unmatchedAt,
                isSelf,
                unmatchedBy:
                    premiumInfo.tier === "gold"
                        ? {
                              displayName: matchDoc.unmatchedBy.displayName,
                              picture: matchDoc.unmatchedBy.primaryPhoto,
                              username: matchDoc.unmatchedBy.username
                          }
                        : "hidden"
            }
        });
    }

    return sendResponse(res, 200, {
        data: {
            matchId: matchDoc._id,
            status: matchDoc.status,
            createdAt: matchDoc.createdAt,
            lastMessageAt: matchDoc.lastMessageAt,
            user: {
                username: opponent.username,
                displayName: opponent.displayName,
                bio: opponent.bio,
                role: opponent.role,
                tech_stack: opponent.tech_stack,
                primaryPhoto: opponent.primaryPhoto,
                pictures: opponent.photos,
                location: {
                    city: opponent.location.city,
                    country: opponent.location.country
                },
                badges: getBadges(opponent.premium)
            }
        }
    });
};
