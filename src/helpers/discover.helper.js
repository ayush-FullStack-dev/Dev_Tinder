import ProfileLike from "../models/ProfileLike.model.js";
import Block from "../models/Block.model.js";
import ProfileSeen from "../models/ProfileSeen.model.js";
import Report from "../models/User.model.js";

import { buildSubscriptionInfo } from "./premium.helper.js";

export const getExcludedIds = async id => {
    const [likedUsers, blockedUsers, blockedByUsers, seenUsers] =
        await Promise.all([
            ProfileLike.findOne({
                likedByUserId: id
            }).select("likedByUserId"),
            Block.findOne({
                blockerUserId: id
            }).select("blockerUserId"),
            Block.findOne({
                blockedUserId: id
            }).select("blockedUserId"),
            ProfileSeen.findOne({
                viewerProfileId: id
            }).select("viewerProfileId")
        ]);

    return [
        likedUsers?.likedByUserId,
        blockedUsers?.blockerUserId,
        blockedByUsers?.blockedUserId,
        seenUsers?.viewerProfileId
    ];
};

export const freeProfileScore = (profiles, currentProfile) => {
    const updatedProfiles = profiles.map(p => {
        let score = 0;
        const premiumInfo = buildSubscriptionInfo(p.premium);

        if (p.location.country === currentProfile.location.country) score += 3;
        if (premiumInfo?.isActive && premiumInfo.tier === "gold") score += 15;

        if (p.location.city === currentProfile.location.city) score += 5;

        score += p.profileScore;

        return {
            ...p,
            _freeScore: score
        };
    });

    return updatedProfiles.sort((a, b) => b._freeScore - a._freeScore);
};

export const silverProfileScore = (profiles, currentProfile) => {
    const updatedProfiles = profiles.map(p => {
        let score = 0;
        const premiumInfo = buildSubscriptionInfo(p.premium);

        if (p.role === currentProfile.role) score += 10;

        const commonTechstack = p.tech_stack.filter(k =>
            currentProfile.tech_stack.includes(k)
        ).length;

        if (premiumInfo?.isActive && premiumInfo.tier === "gold") score += 15;

        if (p.location.country === currentProfile.location.country) score += 3;

        if (p.location.city === currentProfile.location.city) score += 5;

        score += commonTechstack * 5;
        score += p.profileScore;

        return {
            ...p,
            _silverScore: score
        };
    });

    return updatedProfiles.sort((a, b) => b._silverScore - a._silverScore);
};

export const goldProfileScore = (profiles, currentProfile) => {
    const updatedProfiles = profiles.map(p => {
        let score = 0;
        const premiumInfo = buildSubscriptionInfo(p.premium);

        if (p.role === currentProfile.role) score += 10;

        const commonTechstack = p.tech_stack.filter(k =>
            currentProfile.tech_stack.includes(k)
        ).length;

        if (premiumInfo?.isActive && premiumInfo.tier === "gold") score += 15;

        if (p.location.country === currentProfile.location.country) score += 3;

        if (p.location.city === currentProfile.location.city) score += 5;

        score += commonTechstack * 5;
        score += p.profileScore;

        return {
            ...p,
            _silverScore: score
        };
    });

    return updatedProfiles.sort((a, b) => b._silverScore - a._silverScore);
};

function ensureArray(value) {
    return Array.isArray(value) ? value : [value];
}

export const goldProfileQuery = query => {
    let baseQuery = {};

    if (query?.role) {
        baseQuery.role = {
            $in: ensureArray(query.role)
        };
    }

    if (query?.country) {
        baseQuery = {
            ...baseQuery,
            "location.country": { $in: ensureArray(query.country) }
        };
    }

    if (query?.expMin) {
        baseQuery.experience_years = {
            ...baseQuery.experience_years,
            $gte: expMin
        };
    }

    if (query?.expMax) {
        baseQuery.experience_years = {
            ...baseQuery.experience_years,
            $gte: expMin
        };
    }

    if (query?.city) {
        baseQuery = {
            ...baseQuery,
            "location.city": { $in: ensureArray(query.city) }
        };
    }

    return baseQuery;
};
