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

export const getBadges = premium => 
    isGoldActive(premium)
        ? ["gold"]
        : isSilverActive(premium)
        ? ["silver"]
        : []

