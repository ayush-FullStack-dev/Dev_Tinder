import Coupon from "../models/subscription/Coupon.model.js";
import connectDB from "../config/mongodb.js";

import { superCoupons } from "./coupon/coupon.constant.js";

await connectDB();

const insertCoupon = async () => {
    const info = await Coupon.insertMany(superCoupons);
};

await insertCoupon();
