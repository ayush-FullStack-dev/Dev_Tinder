export const paginationInfos = (info, limit, viewedAt) => {
    let hasMore = false;

    if (info.length > limit) {
        hasMore = true;
        info.pop();
    }
    const nextCursor =
        info.length > 0 && hasMore ? info[info.length - 1][viewedAt] : null;

    return {
        success: true,
        info,
        pagination: {
            nextCursor,
            hasMore,
            limit
        }
    };
};

export const queryLimit = (limit, premiumInfo) => {
    if (!premiumInfo?.isActive) {
        return Math.min(Number(limit) || 10, 30);
    }

    return Math.min(Number(limit) || 20, 60);
};
