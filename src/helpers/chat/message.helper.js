export const getMessageStatus = (isDeletedForEveryone, readBy, deliveredTo) => {
    return isDeletedForEveryone
        ? "deleted"
        : readBy.readAt
        ? "read"
        : deliveredTo.deliveredAt
        ? "delivered"
        : "sent";
};

export const getReaction = (reactions, myId) => {
    const reactionMap = {};

    reactions.forEach(r => {
        if (!reactionMap[r.emoji]) {
            reactionMap[r.emoji] = {
                emoji: r.emoji,
                count: 0,
                reactedByMe: false,
                users: []
            };
        }

        r.users.forEach(userId => {
            reactionMap[r.emoji].count += 1;

            const isMe = String(userId) === String(myId);

            if (isMe) reactionMap[r.emoji].reactedByMe = true;

            reactionMap[r.emoji].users.push({
                userId,
                role: isMe ? "me" : "opponent"
            });
        });
    });

    return reactionMap;
};

export const getMessagePayload = (message, currentProfile) => {
    const sender =
        String(message.senderId) === String(currentProfile._id)
            ? "me"
            : "opponent";

    const isDeletedForEveryone = !!message.deletedForEveryoneAt;

    return {
        messageId: message._id,
        type: message.type,
        text: message.text,
        sender,
        senderId: message.senderId,
        media:
            !isDeletedForEveryone && message.media.url
                ? {
                      url: message.media.url,
                      key: message.media.key,
                      mimeType: message.media.mimeType,
                      size: message.media.size,
                      duration: message.media.duration,
                      width: message.media.width,
                      height: message.media.height
                  }
                : {
                      url: null,
                      key: null,
                      mimeType: null,
                      size: null,
                      duration: null,
                      width: null,
                      height: null
                  },

        replyTo: message.replyTo,

        forwarded: {
            isForwarded: message.forwarded.isForwarded,
            fromUserId: message.forwarded.fromUserId,
            originalMessageId: message.forwarded.originalMessageId
        },

        edited: !!message.editedAt,
        editedAt: message.editedAt,

        reactions: getReaction(message.reactions, currentProfile._id),

        deleted: {
            forEveryone: isDeletedForEveryone
        },

        timestamps: {
            sentAt: message.createdAt,
            deliveredAt: message.deliveredTo.deliveredAt,
            readAt: message.readBy.readAt
        },

        status: getMessageStatus(
            isDeletedForEveryone,
            message.readBy,
            message.deliveredTo
        )
    };
};
