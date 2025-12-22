export const checkMethodHooping = async (savedInfo, value) => {
    if (savedInfo.risk !== value.risk)
        return "This request is prevent Method-hopping attack!";

    if (
        savedInfo?.allowedMethod &&
        !savedInfo?.allowedMethod?.includes(value.method)
    )
        return "This request is prevent Method-hopping attack!";

    return null;
};
