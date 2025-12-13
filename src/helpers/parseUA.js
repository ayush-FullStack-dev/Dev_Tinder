import { UAParser } from "ua-parser-js";

export const parseUA = userAgent => {
    if (!userAgent.includes("KHTML")) {
        userAgent = `Mozilla/5.0 (Linux; Android 13; SM-M326B) AppleWebKit/537.36 
(KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36`;
    }
    const parser = new UAParser(userAgent);
    let deviceType = null;
    const result = parser.getResult();
    if (userAgent.includes("Mobile")) {
        deviceType = "mobile";
    } else if (
        ua.includes("tablet") ||
        ua.includes("ipad") ||
        ua.includes("sm-t") ||
        ua.includes("xoom") ||
        ua.includes("silk") ||
        ua.includes("kindle")
    ) {
        deviceType = "tab";
    } else {
        deviceType = "deskopt";
    }
    return {
        browser: result.browser.name,
        browserVersion: result.browser.version,
        os: result.os.name,
        deviceType,
        osVersion: result.os.version,
        deviceModel: result.device.model
    };
};
