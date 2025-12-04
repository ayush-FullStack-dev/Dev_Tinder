import joi from "joi";

export const signupValidators = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    username: joi.string().required().min(3),
    password: joi
        .string()
        .required()
        .min(6)
        .max(30)
        .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/),
    confirmPassword: joi.string().required().valid(joi.ref("password")),
    age: joi.number().min(15),
    gender: joi.string().valid("female", "male", "transgender"),
    role: joi.string().valid("user")
});
