import sendResponse from "../../../../helpers/sendResponse.js";

import {
    buildPacksInfo,
    activeBoosts
} from "../../../../helpers/premium.helper.js";

import { updateProfile } from "../../../../services/profile.service.js";

export const boostProfile = async (req, res) => {
    const { currentProfile } = req.auth;
    const packsInfo = buildPacksInfo(currentProfile.packs);

    const boosts = activeBoosts(currentProfile.packs.features);

    if (boosts.isActive) {
        return sendResponse(res, 200, {
            message: "Boost is already active",
            code: "BOOST_ALREADY_ACTIVE",
            data: {
                endsAt: boosts.expiresAt
            }
        });
    }

    if ((currentProfile.packs.benefits?.boosts ?? 0) <= 0) {
        return sendResponse(res, 402, {
            message: "No Boost credits remaining",
            code: "BOOST_CREDITS_EXHAUSTED",
            next: "buy_pack",
            route: "/packs",
            meta: {
                activePack: currentProfile.packs.activePack,
                boostsRemaining: 0
            }
        });
    }

    if (currentProfile.premium?.features?.incognito?.enabled) {
        return sendResponse(res, 409, {
            message: "Disable Incognito to use Boost",
            code: "BOOST_NOT_ALLOWED_IN_INCOGNITO"
        });
    }

    const updatedInfo = await updateProfile(
        {
            _id: currentProfile._id,
            "packs.benefits.boosts": { $gt: 0 },
            "packs.features.boost.active": { $ne: true }
        },
        {
            $set: {
                "packs.features.boost": {
                    active: true,
                    startedAt: new Date(),
                    endsAt: new Date(Date.now() + 1000 * 60 * 30)
                }
            },
            $inc: { "packs.benefits.boosts": -1 }
        }
    );

    if (!updatedInfo) {
        return sendResponse(res, 409, {
            message: "Boost credits just got used",
            code: "BOOST_CREDITS_RACE_CONDITION"
        });
    }

    return sendResponse(res, 200, {
        success: true,
        message: "Boost activated",
        data: {
            active: true,
            durationMinutes: 30,
            startedAt: updatedInfo.packs.features.boost.startedAt,
            endsAt: updatedInfo.packs.features.boost.endsAt
        },
        meta: {
            pack: currentProfile.packs.activePack,
            boostsRemaining: updatedInfo.packs.benefits?.boosts
        }
    });
};
