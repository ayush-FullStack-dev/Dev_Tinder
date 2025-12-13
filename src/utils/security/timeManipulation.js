export const checkTimeManipulation = time => {
    const diff = Math.abs(time.serverTime - time.clientTime);
    if (diff > 2 * 60 * 1000) {
        return { success: false, message: "Time Manipulation Attack detcted" };
    }
    return { success: true };
};

