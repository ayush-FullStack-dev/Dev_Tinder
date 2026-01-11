import Report from "../../../../models/Report.model.js";
import sendResponse from "../../../../helpers/sendResponse.js";

import { reportReason } from "../../../../constants/profile.constant.js";

export const reportProfile = async (req, res) => {
    const { currentProfile, profile } = req.auth;

    if (!req.body || (req.body && Object.keys(req.body)?.length === 0)) {
        return sendResponse(res, 400, "Report details are required");
    }
    const message = req.body.message?.trim();

    if (!reportReason.includes(req.body.reason)) {
        return sendResponse(res, 400, {
            message: "Invalid report reason",
            allowed: reportReason
        });
    }

    if (req.body.reason === "other" && !message) {
        return sendResponse(res, 400, {
            success: false,
            message: "Message is required when reason is 'other'"
        });
    }

    if (currentProfile.id === profile.id) {
        return sendResponse(res, 400, "You cannot report your own profile");
    }

    const alreadyReported = await Report.exists({
        reporterUserId: currentProfile._id,
        reportedUserId: profile._id,
        createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 12) }
    });

    if (alreadyReported) {
        return sendResponse(
            res,
            429,
            "You have already reported this profile recently"
        );
    }

    await Report.create({
        reporterUserId: currentProfile._id,
        reportedUserId: profile._id,
        reason: req.body.reason,
        message: message || ""
    });

    return sendResponse(
        res,
        201,
        "Profile reported successfully. Our team will review this report."
    );
};

export const reportedProfiles = async (req, res) => {
    const { currentProfile } = req.auth;
    let hasMore = false;
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const query = {
        reporterUserId: currentProfile._id
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

    const reportedProfile = await Report.find(query);
    const reportedCount = await Report.countDocuments({
        reporterUserId: currentProfile._id
    });

    if (reportedProfile.length > limit) {
        hasMore = true;
        reportedProfile.pop();
    }

    const nextCursor =
        reportedProfile.length > 0 && hasMore
            ? reportedProfile[reportedProfile.length - 1].createdAt
            : null;

    const reponse = {
        total: reportedCount,
        reports: [],
        pagination: {
            limit,
            hasMore,
            nextCursor
        }
    };

    for (const reportInfo of reportedProfile) {
        reponse.reports.push({
            reportedUsername: reportInfo.reportedUserId.username,
            reason: reportInfo.reason,
            message: reportInfo.message,
            status: reportInfo.status,
            reportedAt: reportInfo.createdAt
        });
    }
    
    return sendResponse(res, 200, reponse);
};
