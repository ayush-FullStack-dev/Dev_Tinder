import geoip from "geoip-lite"

export const maskIp = ip => {
    if (!ip || typeof ip !== "string") return "";

    // IPv6
    if (ip.includes(":")) {
        const parts = ip.split(":");
        return `${parts[0]}:${parts[1]}:****:****:****:${
            parts[parts.length - 1]
        }`;
    }

    // IPv4
    const parts = ip.split(".");
    if (parts.length !== 4) return ip;

    return `${parts[0]}.***.***.${parts[3]}`;
};

export const getIpInfo = (ip = "103.21.33.0") => {
    if (ip.includes("::ffff:") || ip === "127.0.0.1") {
        ip = "103.21.33.0";
    }
    const geo = geoip.lookup(ip);
    return {
        country: geo?.country,
        timezone: geo?.timezone,
        region: geo?.region,
        city: geo?.city,
        ip,
        location: `${geo?.city},${geo?.country}`
    };
};
