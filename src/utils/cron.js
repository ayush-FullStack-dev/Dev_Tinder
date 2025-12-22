import crypto from "crypto";

export const tokenBuilder = userInfo => {
    const id = crypto.randomBytes(16).toString("hex");
    return {
        ip: userInfo.ip,
        country: userInfo.country,
        city: userInfo.city,
        ctxId: id,
        deviceId: userInfo.deviceId,
        browser: userInfo.browser,
        os: userInfo.os,
        deviceType: userInfo.deviceType,
        deviceSize: userInfo.deviceSize,
        deviceModel: userInfo.deviceModel,
        deviceName: `${userInfo.browser} on ${userInfo.os}`,
        timezone: userInfo.timezone,
        token: userInfo.token,
        version: 1,
        fingerprint: userInfo.fingerprint,
        createdAt: Date.now(),
        loginContext: {
            primary: {
                method: userInfo.loginContext.primary.method || "password",
                timestamp: Date.now()
            },
            mfa: {
                required: !!userInfo.loginContext.mfa?.required,
                complete: !!userInfo.loginContext.mfa?.complete,
                methodsUsed: userInfo.loginContext.mfa?.methodsUsed || "none"
            },
            trust: {
                deviceTrusted: !!userInfo.loginContext.trust?.deviceTrusted,
                sessionLevel: userInfo.loginContext.trust?.sessionLevel || "low"
            }
        }
    };
};
