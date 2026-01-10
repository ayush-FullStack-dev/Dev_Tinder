import { verifyAccesToken } from "../../helpers/token.js";

export const optionalLogin = (req, res, next) => {
    const accessToken = req.signedCookies?.accessToken;
    const refreshToken = req.signedCookies?.refreshToken;
    const data = verifyAccesToken(accessToken);

    req.auth = {
        ...req.auth,
        refreshToken,
        logged: false
    };

    if (data?.success) {
        req.auth.logged = true;
        req.auth.info = data?.data;
    }

    return next();
};
