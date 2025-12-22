export function getLogoutInfo(reason, action, device, ctxId) {
    if (!device) {
        return {
            reason: reason || "manual",
            id: ctxId || crypto.randomUUID(),
            at: Date.now(),
            action: action ?? "logout"
        };
    }
    return {
        reason: reason || "manual",
        id: crypto.randomUUID(),
        at: Date.now(),
        action: action ?? "logout",
        ...device
    };
}