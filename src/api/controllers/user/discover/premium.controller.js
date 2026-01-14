import sendResponse from "../../../../helpers/sendResponse.js";

import {
    buildPacksInfo,
    activeBoosts
} from "../../../../helpers/premium.helper.js";

import { updateProfile } from "../../../../services/profile.service.js";

export const boostProfile = async (req, res) => {
    const { currentProfile } = req.auth;
    const packsInfo = buildPacksInfo(currentProfile.packs);

    if (currentProfile.packs.activePack !== "none") {
        return sendResponse(res, 403, {
            message:
                "Boost not available. Buy a Starter Pack to activate Boost.",
            code: "BOOST_NOT_AVAILABLE",
            next: "buy_pack",
            route: "/packs",
            meta: {
                activePack: packsInfo.tier,
                boostsRemaining: currentProfile.packs?.benefits?.boosts ?? 0
            }
        });
    }

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

    if (currentProfile.packs.benefits?.boosts === 0) {
        return sendResponse(res, 403, {
            message: "No Boost credits remaining",
            code: "BOOST_CREDITS_EXHAUSTED",
            next: "buy_pack",
            route: "/packs",
            meta: {
                activePack: packsInfo.tier,
                boostsRemaining: 0
            }
        });
    }

    const updatedInfo = await updateProfile(
        {
            _id: currentProfile._id
        },
        {
            "packs.features.boost": {
                active: true,
                startedAt: new Date(),
                endsAt: new Date(Date.now() + 1000 * 60 * 30)
            },
            $inc: { "packs.benefits.boosts": -1 }
        }
    );

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
            pack: packsInfo.tier,
            boostsRemaining: updatedInfo.packs.benefits?.boosts
        }
    });
};
