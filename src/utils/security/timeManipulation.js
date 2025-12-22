export const checkTimeManipulation = time => {
    const diff = Math.abs(
        time?.serverTime || Date.now() - time?.clientTime || Date.now()
    );
    if (diff < 2 * 60 * 1000) {
        return { success: false, message: "Time Manipulation Attack detcted" };
    }
    return { success: true };
};
