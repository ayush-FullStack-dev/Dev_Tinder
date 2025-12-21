import { verifyAccesToken } from "../../helpers/token.js";
import sendResponse from "../../helpers/sendResponse.js";

export const isLogin = (req, res, next) => {
    const accessToken = req.signedCookies.accessToken;
    const refreshToken = req.signedCookies.refreshToken;
    const data = verifyAccesToken(accessToken);

    if (!accessToken) {
        return sendResponse(res, 401, {
            message: "Login required to access this resource."
        });
    }

    if (!data?.success) {
        return sendResponse(res, 401, {
            message: data.message
        });
    }

    req.auth.info = data.data;
    req.auth.refreshToken = refreshToken;
    next();
};

export const findLoginData = async (req, res, next) => {
    const { info } = req.auth;

    const user = await findUser({
        _id: info._id
    });

    if (!user) {
        return sendResponse(res, 401, {
            message: "AccessToken is inavlid please login again."
        });
    }

    const findedToken = user.refreshToken.find(k => k.token === refreshToken);
    
    req.auth.findedCurrent = findedToken
    req.auth.user = user;
    next();
};
