import epochify from "epochify";
import { compareFingerprint } from "../fingerprint.js";
import { checkTimeManipulation } from "./timeManipulation.js"

export const getRiskLevel = score => {
    if (score <= 20) return "verylow";
    if (score <= 40) return "low";
    if (score <= 60) return "mid";
    if (score <= 80) return "high";
    return "veryhigh";
};

export const getRiskScore = async (current, last, others) => {
    let score = 0;

    const hour = new Date().getHours();
    const diffMin = epochify.getDiff(Date.now(), last.createdAt, "minute");
    const diffDay = epochify.getDiff(Date.now(), last.createdAt, "days");

    const timeManip = checkTimeManipulation(others.time);
    const fpValid = await compareFingerprint(
        current,
        last.fingerprint ||
            "$2b$10$EDstMQkU6TFzC9cRATw32OtFI15cveoGhDM0fgYlg9N.9zP2P9AAq"
    );

    let geoScore = 0;

    if (current.country !== last.country) {
        geoScore += 30;
    } else if (current.city !== last.city) {
        geoScore += 10;
    }

    if (current.timezone !== last.timezone) {
        geoScore += current.country === last.country ? 10 : 5;
    }

    score += Math.min(geoScore, 40);

    let deviceChanged = false;
    let deviceScore = 0;

    if (current.deviceId !== last.deviceId) {
        deviceChanged = true;
        deviceScore += 30;
    }

    if (deviceChanged && !fpValid) {
        deviceScore += 15;
    }

    if (deviceChanged && fpValid) {
        deviceScore -= 5;
    }

    score += Math.min(Math.max(deviceScore, 0), 45);

    if (diffMin < 10 && deviceChanged) {
        score += 15;
    }

    if (hour <= 5 && deviceChanged) {
        score += 5;
    }

    if (!timeManip?.success) {
        score += 20;
    }

    if (diffDay >= 30) {
        score += 15;
    }

    if (diffDay >= 30 && current.country !== last.country) {
        score += 10;
    }

    return Math.min(score, 100);
};
