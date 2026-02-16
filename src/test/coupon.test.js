import Coupon from "../models/subscription/Coupon.model.js";
import connectDB from "../config/mongodb.js";

const couponsArray = [
    {
        code: "NEWUSER50",
        title: "New User Flat ₹50",
        description: "Flat ₹50 off for new users",
        discount: { type: "flat", value: 50 },
        minOrderAmount: 199,
        applicablePlans: [],
        excludedPlans: [],
        validFrom: new Date("2026-01-01"),
        validTill: new Date("2026-12-31"),
        usage: { totalLimit: 5000, perUserLimit: 1, usedCount: 0 },
        userRestriction: "new_users",
        stackable: false,
        status: "active"
    },

    {
        code: "NEWUSER20",
        title: "20% New User Discount",
        description: "20% off for first purchase",
        discount: { type: "percentage", value: 20, maxDiscount: 100 },
        minOrderAmount: 299,
        applicablePlans: [],
        excludedPlans: [],
        validFrom: new Date("2026-01-01"),
        validTill: new Date("2026-12-31"),
        usage: { totalLimit: 3000, perUserLimit: 1, usedCount: 0 },
        userRestriction: "new_users",
        stackable: false,
        status: "active"
    },

    {
        code: "EXISTING10",
        title: "10% Loyalty Discount",
        description: "Only for existing users",
        discount: { type: "percentage", value: 10, maxDiscount: 150 },
        minOrderAmount: 499,
        applicablePlans: [],
        excludedPlans: [],
        validFrom: new Date("2026-01-01"),
        validTill: new Date("2026-06-30"),
        usage: { totalLimit: 2000, perUserLimit: 2, usedCount: 0 },
        userRestriction: "existing_users",
        stackable: false,
        status: "active"
    },

    {
        code: "FLAT99",
        title: "Flat ₹99 Off",
        description: "Flat discount for all users",
        discount: { type: "flat", value: 99 },
        minOrderAmount: 999,
        applicablePlans: [],
        excludedPlans: [],
        validFrom: new Date("2026-01-01"),
        validTill: new Date("2026-03-31"),
        usage: { totalLimit: 1000, perUserLimit: 1, usedCount: 0 },
        userRestriction: "all",
        stackable: false,
        status: "active"
    },

    {
        code: "PLANBASIC50",
        title: "Basic Plan Offer",
        description: "Only valid on BASIC plan",
        discount: { type: "flat", value: 50 },
        minOrderAmount: 199,
        applicablePlans: ["BASIC"],
        excludedPlans: [],
        validFrom: new Date("2026-01-01"),
        validTill: new Date("2026-12-31"),
        usage: { totalLimit: null, perUserLimit: 1, usedCount: 0 },
        userRestriction: "all",
        stackable: false,
        status: "active"
    },

    {
        code: "NOPREMIUM",
        title: "No Premium Plan",
        description: "Not valid on premium plans",
        discount: { type: "percentage", value: 15, maxDiscount: 200 },
        minOrderAmount: 499,
        applicablePlans: [],
        excludedPlans: ["PREMIUM"],
        validFrom: new Date("2026-01-01"),
        validTill: new Date("2026-12-31"),
        usage: { totalLimit: 3000, perUserLimit: 1, usedCount: 0 },
        userRestriction: "all",
        stackable: false,
        status: "active"
    },

    {
        code: "ABTESTA",
        title: "A Variant Coupon",
        description: "A/B testing variant A",
        discount: { type: "percentage", value: 25, maxDiscount: 120 },
        minOrderAmount: 399,
        applicablePlans: [],
        excludedPlans: [],
        validFrom: new Date("2026-01-01"),
        validTill: new Date("2026-02-28"),
        usage: { totalLimit: 1000, perUserLimit: 1, usedCount: 0 },
        userRestriction: "all",
        stackable: false,
        status: "active"
    },

    {
        code: "ABTESTB",
        title: "B Variant Coupon",
        description: "A/B testing variant B",
        discount: { type: "percentage", value: 30, maxDiscount: 100 },
        minOrderAmount: 399,
        applicablePlans: [],
        excludedPlans: [],
        validFrom: new Date("2026-01-01"),
        validTill: new Date("2026-02-28"),
        usage: { totalLimit: 1000, perUserLimit: 1, usedCount: 0 },
        userRestriction: "all",
        stackable: false,
        status: "active"
    },

    {
        code: "FLASH24",
        title: "Flash Sale",
        description: "Limited time offer",
        discount: { type: "flat", value: 150 },
        minOrderAmount: 999,
        applicablePlans: [],
        excludedPlans: [],
        validFrom: new Date("2026-02-01"),
        validTill: new Date("2026-02-02"),
        usage: { totalLimit: 200, perUserLimit: 1, usedCount: 0 },
        userRestriction: "all",
        stackable: false,
        status: "active"
    },

    {
        code: "STACK5",
        title: "Stackable Small Discount",
        description: "Can be stacked with other coupons",
        discount: { type: "percentage", value: 5, maxDiscount: 50 },
        minOrderAmount: 199,
        applicablePlans: [],
        excludedPlans: [],
        validFrom: new Date("2026-01-01"),
        validTill: new Date("2026-12-31"),
        usage: { totalLimit: null, perUserLimit: 3, usedCount: 0 },
        userRestriction: "all",
        stackable: true,
        status: "active"
    }
];

await connectDB();

const insertCoupon = async () => {
   const info = await Coupon.insertMany(couponsArray);
};

await insertCoupon();
