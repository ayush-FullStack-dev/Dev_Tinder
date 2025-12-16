import { cleanupLogin, setSession } from "../services/session.service.js";

export const setTwoFa = async (ctxId, userInfo) => {
    const twoFaCtxId = crypto.randomBytes(16).toString("hex");
    userInfo.token = twoFaCtxId;
    userInfo.loginContext.mfa = {
        required: true,
        complete: false
    };

    await cleanupLogin(ctxId);
    await setSession(
        {
            verified: true,
            risk: info.risk
        },
        twoFaCtxId,
        "2fa:data"
    );

    return {
        info: userInfo,
        reponse: {
            message: "2fa required you need to verify-2fa step",
            allowedMethod: methods,
            ctxId: twoFaCtxId
        }
    };
};
