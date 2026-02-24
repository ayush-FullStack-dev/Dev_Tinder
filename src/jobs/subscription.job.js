import Subscription from "../models/subscription/Subscription.model.js";

import { findProfile, updateProfile } from "../services/profile.service.js";

export const handleSubscriptioncarriedForwardDays = async () => {
    await Subscription.updateMany(
        {
            using: true,
            used: false,
            carriedForwardDays: { $gt: 0 }
        },
        {
            $inc: {
                carriedForwardDays: -1
            }
        }
    );
};

export const handleSubscriptionExpiry = async () => {
    const day = 1000 * 60 * 60 * 24;

    const expiredUsers = await findProfile(
        {
            "premium.expiresAt": { $lte: new Date() },
            "premium.isLifetime": false,
            "premium.type": { $ne: "free" }
        },
        {
            many: true
        }
    );

    if (!expiredUsers.length) {
        return;
    }

    const expiredIds = expiredUsers.map(u => u.premium.subscriptionId);
    const subscriptionId = [];

    const subscriptions = await Subscription.find({
        _id: {
            $in: expiredIds
        },
        used: false,
        using: false,
        $and: [
            {
                $or: [{ carriedForwardDays: { $gt: 0 } }, { isLifetime: true }]
            },
            {
                $expr: {
                    $neq: ["$fromPlan", "$toPlan"]
                }
            }
        ]
    }).sort({
        createdAt: -1
    });

    if (!subscriptions.length) {
        return;
    }

    for (const user of expiredUsers) {
        const userSubscription = subscriptions.filter(
            s => String(s.userId) === String(user._id)
        );

        subscriptionId.push(user.premium.subscriptionId);

        if (!userSubscription.length) {
            await updateProfile(
                user._id,
                {
                    $set: {
                        "premium.type": "free",
                        "premium.since": null,
                        "premium.subscriptionId": null,
                        "premium.expiresAt": null,
                        "premium.isLifetime": false
                    }
                },
                {
                    id: true
                }
            );

            continue;
        }

        const lastSubscription = [...userSubscription].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        )[0];

        const expireIn = day * lastSubscription.carriedForwardDays;

        await updateProfile(
            user._id,
            {
                $set: {
                    premium: {
                        type: lastSubscription.toPlan,
                        isLifetime: lastSubscription.isLifetime,
                        since: new Date(),
                        subscriptionId: lastSubscription._id,
                        expiresAt: lastSubscription.isLifetime
                            ? null
                            : new Date(Date.now() + expireIn)
                    }
                }
            },
            {
                id: true
            }
        );
    }

    await Subscription.updateMany(
        {
            _id: {
                $in: subscriptionId
            },
            isLifetime: false
        },
        {
            used: true,
            carriedForwardDays: 0,
            using: false
        }
    );
};
