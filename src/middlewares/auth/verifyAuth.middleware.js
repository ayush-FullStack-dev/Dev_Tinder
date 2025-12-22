export const verifyVerifaction = async (req, res, next) => {
    const { user } = req.auth;
    const ctxId = req.signedCookies.verify_ctx;
    const time = getTime(req);
    const validate = checkValidation(
        verifyLoginValidator,
        req,
        "validation faild for verification",
        
    );

    const getDeviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        validate.value,
        getIpInfo(req.realIp)
    );

    const savedDeviceInfo = await getSession(`verify:info:${ctxId}`);
    const savedInfo = await getSession(`verify:ctx:${ctxId}`);

    if (!savedInfo?.success) {
        return sendResponse(res, 401, {
            message:
                "Your Verification session has expired. Please start again.",
            action: "RESTART_VERIFACTION"
        });
    }

    const riskScore = await getRiskScore(getDeviceInfo, savedDeviceInfo, {
        time
    });

    if (riskScore > 0) {
        await cleanupLogin(ctxId);
        return sendResponse(
            res,
            401,
            "We detected unusual activity. This request has been stopped for your security"
        );
    }

    const isMethodHooping = checkMethodHooping(savedInfo, validate.value);
    if (isMethodHooping) {
        await cleanupLogin(ctxId);
        return sendResponse(res, 401, isMethodHooping);
    }

    req.auth = {
        ...req.auth,
        user: user,
        values: validate.value,
        info: savedInfo,
        ctxId: ctxId,
        incomingCredentialId: Buffer.from(
            validate.value.id || "test",
            "base64url"
        ),
        deviceInfo: getDeviceInfo
    };

    return next();
};
