function sendResponse(response, code, option, success) {
    const isSuccess = String(code).startsWith("2");
    if (typeof option === "string") {
        return response.status(code).json({
            success: success || isSuccess,
            message: option
        });
    }
    return response.status(code).json({
        success: success || isSuccess,
        ...option
    });
}

export default sendResponse;
