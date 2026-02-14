export const PLANS = {
    FREE: {
        id: "free",
        price: 0,
        duration: 0,
        features: {
            // 🔥 Swipes
            swipesPerDay: 30,
            rightSwipesPerDay: 15,
            swipeUnlimited: false,

            // 🔁 Rewind
            rewindsPerDay: 0,
            rewindEnabled: false,

            // 👀 Visibility
            seeWhoLiked: false,
            seeWhoViewed: false,

            // 🕶️ Privacy & Customization
            incognito: false,
            customRingtone: false,

            // 💬 Chat
            chatMediaLimitMB: 15,
            deleteAllMessages: false,

            // 🔍 Discover Filters
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

            // 👀 Visibility
            seeWhoLiked: true, // ⚠️ blurred after 5
            seeWhoViewed: false,

            // 🕶️ Privacy & Customization
            incognito: true,
            customRingtone: true,

            // 💬 Chat
            chatMediaLimitMB: 50,
            deleteAllMessages: false,

            // 🔍 Discover Filters
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
            rewindsPerDay: 10, // lifetime handled separately
            rewindEnabled: true,

            // 👀 Visibility
            seeWhoLiked: true, // full unblurred + pagination
            seeWhoViewed: true,

            // 🕶️ Privacy & Customization
            incognito: true,
            customRingtone: true,

            // 💬 Chat
            chatMediaLimitMB: 100,
            deleteAllMessages: true,

            // 🔍 Discover Filters
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
