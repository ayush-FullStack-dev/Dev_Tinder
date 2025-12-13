import { signToken } from "./jwt.js";

export function getAccesToken(user) {
    return signToken(
        {
            _id: user._id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            role: user.role,
            age: user.age,
            gender: user.gender
        },
        "30m"
    );
}

export function getRefreshToken(data, expiry) {
    return signToken(data, expiry);
}
