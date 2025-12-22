import crypto from "crypto"
import { cleanupLogin, setSession } from "../services/session.service.js";


export const setTwoFa = async (ctxId, userInfo, methods) => {
    const twoFaCtxId = crypto.randomBytes(16).toString("hex");
    userInfo.ctxId = twoFaCtxId;
    userInfo.loginContext.mfa = {
        required: true,
        complete: false
    };

    if (ctxId) {
        await cleanupLogin(ctxId);
    }
    
    await setSession(
        {
            verified: true,
            risk: userInfo.loginContext.trust.sessionLevel.risk
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
