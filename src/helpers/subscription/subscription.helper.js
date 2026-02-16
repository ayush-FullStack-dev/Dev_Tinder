export const isGoldActive = premium =>
    premium &&
    premium.type === "gold" &&
    (premium.isLifetime || premium.expiresAt > Date.now());

export const isSilverActive = premium =>
    premium &&
    premium.type === "silver" &&
    (premium.isLifetime || premium.expiresAt > Date.now());

export const buildSubscriptionInfo = premium => {
    const isActive =
        premium?.type !== "free" &&
        (premium?.isLifetime ||
            (premium?.expiresAt && premium.expiresAt > Date.now()));

    return {
        tier: premium?.type || "free",
        isActive,
        isLifetime: !!premium?.isLifetime,
        expiresAt: premium?.isLifetime ? null : premium?.expiresAt
    };
};

export const buildPacksInfo = packs => {
    const isActive =
        packs?.activePack !== "none" &&
        packs?.expiresAt &&
        packs.expiresAt > Date.now();

    return {
        tier: isActive ? packs?.activePack : "none",
        isActive,
        expiresAt: packs?.expiresAt
    };
};

export const activeBoosts = features => {
    const isActive =
        features.boost?.active &&
        features.boost?.endsAt &&
        features.boost.endsAt > Date.now();

    return {
        isActive,
        expiresAt: features.boost.endsAt
    };
};

export const getBadges = premium =>
    isGoldActive(premium)
        ? ["gold"]
        : isSilverActive(premium)
        ? ["silver"]
        : [];
