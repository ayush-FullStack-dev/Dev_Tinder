import { CFEnvironment, Cashfree } from "cashfree-pg";

const cashfree = new Cashfree(
    CFEnvironment.PRODUCTION,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

export default cashfree;
