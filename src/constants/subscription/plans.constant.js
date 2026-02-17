export const PLANS = {
    FREE: {
        id: "free",
        price: 0,
        duration: 0,
        features: {
            swipesPerDay: 30,
            rightSwipesPerDay: 15,
            swipeUnlimited: false,

            // 🔁 Rewind
            rewindsPerDay: 0,
            rewindEnabled: false,

            // 🚀 Boost
            monthlyBoostCredits: 0, // ❌ none

            // 📞 Ringtones
            ringtone: {
                incoming: {
                    enabled: false,
                    minDurationSec: null,
                    maxDurationSec: null
                },
                ringback: {
                    enabled: false,
                    minDurationSec: null,
                    maxDurationSec: null
                }
            },

            // 👀 Visibility
            seeWhoLiked: false,
            seeWhoViewed: false,
            seeUnmatchedBy: false,

            // 🔄 Match
            restoreMatch: false, // ❌ premium only

            // 🕶️ Privacy
            incognito: false,

            // 💬 Chat
            chatMediaLimitMB: 15,
            deleteAllMessages: false,

            // 🔍 Discover
            discoverFilters: {
                country: true,
                city: false,
                role: false,
                techStack: false,
                experience: false,
                distance: false
            }
        }
    },

    SILVER: {
        id: "silver",
        price: 199,
        duration: 30,
        features: {
            // 🔥 Swipes
            swipesPerDay: 60,
            rightSwipesPerDay: 50,
            swipeUnlimited: false,

            // 🔁 Rewind
            rewindsPerDay: 0,
            rewindEnabled: false,

            // 🚀 Boost
            monthlyBoostCredits: 2, // 🥈 2 / month

            // 📞 Ringtones
            ringtone: {
                incoming: {
                    enabled: true,
                    minDurationSec: 5,
                    maxDurationSec: 15
                },
                ringback: {
                    enabled: false, // ❌ gold only
                    minDurationSec: null,
                    maxDurationSec: null
                }
            },

            // 👀 Visibility
            seeWhoLiked: true, // blurred after 5
            seeWhoViewed: false,
            seeUnmatchedBy: false,

            // 🔄 Match
            restoreMatch: true, // ✅ allowed

            // 🕶️ Privacy
            incognito: true,

            // 💬 Chat
            chatMediaLimitMB: 50,
            deleteAllMessages: false,

            // 🔍 Discover
            discoverFilters: {
                country: true,
                city: true,
                role: true,
                techStack: true,
                experience: false,
                distance: false
            }
        }
    },

    GOLD: {
        id: "gold",
        price: 399,
        duration: 30,
        features: {
            // 🔥 Swipes
            swipesPerDay: null,
            rightSwipesPerDay: null,
            swipeUnlimited: true,

            // 🔁 Rewind
            rewindsPerDay: 10,
            rewindEnabled: true,

            // 🚀 Boost
            monthlyBoostCredits: 4, // 🥇 4 / month

            // 📞 Ringtones
            ringtone: {
                incoming: {
                    enabled: true,
                    minDurationSec: 5,
                    maxDurationSec: 15
                },
                ringback: {
                    enabled: true,
                    minDurationSec: 6,
                    maxDurationSec: 15
                }
            },

            // 👀 Visibility
            seeWhoLiked: true,
            seeWhoViewed: true,
            seeUnmatchedBy: true,

            restoreMatch: true,

            // 🕶️ Privacy
            incognito: true,

            // 💬 Chat
            chatMediaLimitMB: 100,
            deleteAllMessages: true,

            // 🔍 Discover
            discoverFilters: {
                country: true,
                city: true,
                role: true,
                techStack: true,
                experience: true,
                distance: true
            }
        }
    }
};
