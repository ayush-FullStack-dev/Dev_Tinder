export const boostProfile = (req, res) => {
    const { currentProfile } = req.auth;
    if (currentProfile.packs.activePack === "none") {
        return sendResponse(res, 403, {
            message:
                "Boost not available. Buy a Starter Pack to activate Boost.",
            code: "BOOST_NOT_AVAILABLE",
            next: "buy_pack",
            route: "/packs",
            meta: {
                activePack: "none",
                boostsRemaining: currentProfile.packs?.benefits?.boosts ?? 0
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
                activePack: currentProfile.packs.activePack,
                boostsRemaining: 0
            }
        });
    }

    if (currentProfile.packs.activePack === "starter_1") {
    }
};
