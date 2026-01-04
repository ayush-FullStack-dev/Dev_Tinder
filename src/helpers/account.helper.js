export const isValidWindow = window => {
    if (window === "24h") {
        return Date.now() - 1000 * 60 * 60 * 24;
    } else if (window === "48h") {
        return Date.now() - 1000 * 60 * 60 * 48;
    } else if (window === "72h") {
        return Date.now() - 1000 * 60 * 60 * 72;
    } else {
        return {
            success: false,
            message: "Invalid time window. Allowed: 24h, 48h, 72h"
        };
    }
};

export const riskSignals = (window, infos, current) => {
    const signals = {
        failedLogins: false,
        newDevice: false,
        newCountry: false,
    };
    const failedLogins = infos.filter(k => k.success !== true).length;

    if (window === "24h" && failedLogins >= 3) {
        signals.failedLogins = true;
    }

    if (window === "48h" && failedLogins >= 5) {
        signals.failedLogins = true;
    }

    if (window === "72h" && failedLogins >= 8) {
        signals.failedLogins = true;
    }

    const newDevices = infos.filter(
        k => k.trusted !== true && k.success === true
    ).length;
    const newCountrys = infos.filter(
        k => k.ipCountry !== current.country && k.success === true
    ).length;

    if (newDevices) {
        signals.newDevice = true;
    }
    if (newCountrys) {
        signals.newCountry = true;
    }

    return signals;
};

export const evaluateSignals = signals => {
    let risk = "none";
    let reasons = [];
    if (signals.newCountry && signals.failedLogins) {
        risk = "high";
    } else if (
        signals.failedLogins ||
        signals.newDevice ||
        signals.newCountry
    ) {
        risk = "elevated";
    }

    if (signals.failedLogins) reasons.push("multiple_failed_logins");
    if (signals.newDevice) reasons.push("new_device_login");
    if (signals.newCountry) reasons.push("new_country_login");
    
    return {
        risk,
        reasons
    };
};
