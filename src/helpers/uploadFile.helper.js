export const validatePhtoInfo = config => {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!config?.fileName || !config?.fileType) {
        return {
            success: false,
            message: "fileName and fileType are required"
        };
    }

    if (!ALLOWED_TYPES.includes(config?.fileType)) {
        return {
            success: false,
            message: `Invalid file type allowd types ${ALLOWED_TYPES.join(
                " , "
            )}`
        };
    }

    return {
        success: true
    };
};
