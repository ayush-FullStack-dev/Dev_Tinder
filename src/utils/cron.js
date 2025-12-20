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
