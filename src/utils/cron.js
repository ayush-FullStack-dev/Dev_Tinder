export const tokenBuilder = userInfo => {
    return {
        ip: userInfo.ip,
        country: userInfo.country,
        city: userInfo.city,
        deviceId: userInfo.deviceId,
        browser: userInfo.browser,
        os: userInfo.os,
        deviceType: userInfo.deviceType,
        deviceSize: userInfo.deviceSize,
        deviceModel: userInfo.deviceModel,
        timezone: userInfo.timezone,
        token: userInfo.token,
        version: 1,
        fingerprint: userInfo.fingerprint,
        createdAt: Date.now(),
        loginContext: {
            twoFA: Boolean(userInfo.twoFA),
            method: userInfo.method ?? "password",
            risk: userInfo.risk ?? "low"
        }
    };
};
