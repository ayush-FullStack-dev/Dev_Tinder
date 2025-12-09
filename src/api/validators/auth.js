import joi from "joi";

const browserLists = [
    "Chrome",
    "Firefox",
    "Safari",
    "Edge",
    "Opera",
    "Brave",
    "Samsung Internet",
    "Vivaldi",
    "DuckDuckGo"
];

const osLists = ["Windows", "MacOS", "Linux", "Android", "iOS", "ChromeOS"];

export const signupValidators = joi.object({
    name: joi.string().required().messages({
        "any.required": "Name is required.",
        "string.empty": "Name cannot be empty."
    }),

    email: joi.string().email().required().messages({
        "string.email": "Please enter a valid email.",
        "any.required": "Email is required."
    }),

    username: joi.string().min(3).required().messages({
        "any.required": "Username is required.",
        "string.min": "Username must be at least 3 characters long."
    }),

    password: joi
        .string()
        .min(6)
        .max(30)
        .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
        .required()
        .messages({
            "any.required": "Password is required.",
            "string.min": "Password must be at least 6 characters.",
            "string.max": "Password cannot be more than 30 characters.",
            "string.pattern.base":
                "Password must include one uppercase letter, one number, and one special character."
        }),

    confirmPassword: joi
        .string()
        .valid(joi.ref("password"))
        .required()
        .messages({
            "any.only": "Passwords do not match.",
            "any.required": "Confirm password is required."
        }),

    age: joi.number().min(15).messages({
        "number.min": "Minimum age allowed is 15."
    }),

    gender: joi.string().valid("female", "male", "transgender").messages({
        "any.only": "Gender must be male, female or transgender."
    }),

    role: joi.string().valid("user").messages({
        "any.only": "Role must be user."
    })
});

export const loginValidators = joi
    .object({
        username: joi.string().messages({
            "string.base": "Username must be a valid string."
        }),

        email: joi.string().email().messages({
            "string.email": "Please enter a valid email."
        }),

        password: joi.string().min(1).required().messages({
            "any.required": "Password is required.",
            "string.empty": "Password cannot be empty."
        }),
        deviceId: joi.string().required().messages({
            "any.required": "deviceId is required.",
            "string.empty": "deviceId cannot be empty."
        }),
        deviceSize: joi.number().required().messages({
            "any.required": "deviceSize is required."
        }),
        timezone: joi.string().required().messages({
            "any.required": " timezone is required.",
            "string.empty": "timezone cannot be empty."
        }),
        remember: joi.boolean().valid(true, false).required().messages({
            "any.only": "Invalid remember type only allowed true or false.",
            "any.required": "remember is required."
        })
    })
    .or("username", "email")
    .messages({
        "object.missing": "Either username or email is required."
    });

export const twoFAValidators = joi.object({
    email: joi.string().email().required().messages({
        "string.email": "Please enter a valid email."
    }),

    password: joi.string().min(1).messages({
        "string.empty": "Password cannot be empty."
    }),

    deviceId: joi.string().required().messages({
        "any.required": "deviceId is required.",
        "string.empty": "deviceId cannot be empty."
    }),
    deviceSize: joi.number().required().messages({
        "any.required": "deviceSize is required."
    }),
    timezone: joi.string().required().messages({
        "any.required": " timezone is required.",
        "string.empty": "timezone cannot be empty."
    }),

    method: joi
        .string()
        .required()
        .valid("EMAIL", "TOTP", "BACKUPCODE")
        .messages({
            "any.only": "Invalid twoFA method.",
            "any.required": "verify method is required."
        }),
    remember: joi.boolean().valid(true, false).required().messages({
        "any.only": "Invalid remember type only allowed true or false.",
        "any.required": "remember is required."
    })
});

export const verifyTwoFAValidators = joi.object({
    email: joi.string().email().required().messages({
        "string.email": "Please enter a valid email."
    }),

    deviceId: joi.string().required().messages({
        "any.required": "deviceId is required.",
        "string.empty": "deviceId cannot be empty."
    }),

    method: joi
        .string()
        .valid("EMAIL", "TOTP", "BACKUPCODE")
        .messages({
            "any.only": "Invalid twoFA method.",
            "any.required": "twoFa method is required."
        })
        .required(),
    deviceId: joi.string().required().messages({
        "any.required": "deviceId is required.",
        "string.empty": "deviceId cannot be empty."
    }),
    code: joi
        .string()
        .pattern(/^\d{6,}$/)
        .required()
        .messages({
            "string.pattern.base": "Code must be minimum 6 digits.",
            "any.required": "Code is required."
        }),
    clientTime: joi.required(),
    remember: joi.boolean().valid(true, false).required().messages({
        "any.only": "Invalid remember type only allowed true or false.",
        "any.required": "remember is required."
    })
});
