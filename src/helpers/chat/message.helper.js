export const getMessageStatus = (isDeletedForEveryone, readBy, deliveredTo) => {
    return isDeletedForEveryone
        ? "deleted"
        : readBy.readAt
        ? "read"
        : deliveredTo.deliveredAt
        ? "delivered"
        : "sent";
};
