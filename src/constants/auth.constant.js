export const cookieOption = {
    httpOnly: true,           // always true ✅
    signed: true,
    secure: process.env.NODE_ENV === "production"
};