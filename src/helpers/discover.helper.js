import ProfileLike from "../models/ProfileLike.model.js";
import Block from "../models/Block.model.js";
import ProfileSeen from "../models/ProfileSeen.model.js";
import Report from "../models/Report.model.js";

import { buildSubscriptionInfo, activeBoosts } from "./premium.helper.js";

export const getExcludedIds = async id => {
    const excludedIds = [];
    const [reportUsers, blockedUsers, blockedByUsers, seenUsers] =
        await Promise.all([
            Report.find({
                reporterUserId: id
            }),
            Block.find({
                blockerUserId: id
            }),
            Block.find({
                blockedUserId: id
            }),
            ProfileSeen.find({
                viewerProfileId: id
            })
        ]);

    for (const user of reportUsers) {
        excludedIds.push(user.reportedUserId);
    }
    for (const user of blockedUsers) {
        excludedIds.push(user.blockedUserId);
    }
    for (const user of blockedByUsers) {
        excludedIds.push(user.blockerUserId);
    }
    for (const user of seenUsers) {
        excludedIds.push(user.seenProfileId);
    }

    return excludedIds;
};

export const freeProfileScore = (profiles, currentProfile) => {
    const updatedProfiles = profiles
        .filter(k => !k.premium?.features?.incognito?.enabled)
        .map(p => {
            let score = 0;
            const premiumInfo = buildSubscriptionInfo(p.premium);

            if (p.location.country === currentProfile.location.country)
                score += 3;
            score += p.profileScore;

            if (premiumInfo?.isActive && premiumInfo.tier === "gold")
                score += 10;

            if (p.packs?.features && activeBoosts(p.packs.features).isActive)
                score += Math.ceil(score * 0.25);

            if (p.location.city === currentProfile.location.city) score += 5;



                if (p.gender !== currentProfile.gender) score += 5;
            

            score = Math.min(score, 100);

            return {
                ...p.toObject(),
                _freeScore: score
            };
        });

    return updatedProfiles.sort((a, b) => b._freeScore - a._freeScore);
};

export const silverProfileScore = (profiles, currentProfile) => {
    const updatedProfiles = profiles
        .filter(k => !k.premium?.features?.incognito?.enabled)
        .map(p => {
            let score = 0;
            const premiumInfo = buildSubscriptionInfo(p.premium);

            if (p.role === currentProfile.role) score += 10;
            score += p.profileScore;

            const commonTechstack = p.tech_stack.filter(k =>
                currentProfile.tech_stack.includes(k)
            ).length;

            if (premiumInfo?.isActive && premiumInfo.tier === "gold")
                score += 10;

            if (p.location.country === currentProfile.location.country)
                score += 3;
            if (p.packs?.features && activeBoosts(p.packs.features).isActive)
                score += Math.ceil(score * 0.25);

            if (p.location.city === currentProfile.location.city) score += 5;
            if (p.gender !== currentProfile.gender) score += 5;

            score += commonTechstack * 5;
            score = Math.min(score, 100);

            return {
                ...p.toObject(),
                _silverScore: score
            };
        });

    return updatedProfiles.sort((a, b) => b._silverScore - a._silverScore);
};

export const goldProfileScore = (profiles, currentProfile) => {
    const updatedProfiles = profiles
        .filter(k => !k.premium?.features?.incognito?.enabled)
        .map(p => {
            let score = 0;
            score += p.profileScore;
            const premiumInfo = buildSubscriptionInfo(p.premium);

            if (p.role === currentProfile.role) score += 10;

            const commonTechstack = p.tech_stack.filter(k =>
                currentProfile.tech_stack.includes(k)
            ).length;

            if (premiumInfo?.isActive && premiumInfo.tier === "gold")
                score += 10;

            if (p.location.country === currentProfile.location.country)
                score += 3;

            if (p.packs?.features && activeBoosts(p.packs.features).isActive)
                score += Math.ceil(score * 0.25);

            if (p.location.city === currentProfile.location.city) score += 5;
            if (p.gender !== currentProfile.gender) score += 5;

            score += Math.min(commonTechstack, 4) * 5;
            score = Math.min(score, 100);

            return {
                ...p,
                _goldScore: score
            };
        });

    return updatedProfiles.sort((a, b) => b._goldScore - a._goldScore);
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
