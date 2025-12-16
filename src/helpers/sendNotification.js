import webpush from "web-push";

export const sendNotification = async (sendInfo, data) => {
    const payload = JSON.stringify(data);
    await webpush.sendNotification(sendInfo, payload);
};
