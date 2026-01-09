import joi from "joi";

import {
    techStacks,
    role,
    lookingFor,
    experienceYearJoiMessage,
    techStackJoiMessage,
    lookingForJoiMessage,
    roleJoiMessage,
    displayNameJoiMessage,
    bioJoiMessage
} from "../../constants/profile.constant.js";

export const profileSetupValidator = joi.object({
    displayName: joi.string().trim().required().messages(displayNameJoiMessage),
    role: joi
        .string()
        .valid(...role)
        .required()
        .messages(roleJoiMessage),
    techStack: joi
        .array()
        .items(joi.string().valid(...techStacks))
        .min(1)
        .unique()
        .required()
        .messages(techStackJoiMessage),
    lookingFor: joi
        .array()
        .items(joi.string().valid(...lookingFor))
        .min(1)
        .unique()
        .required()
        .messages(lookingForJoiMessage),
    experienceYears: joi
        .number()
        .min(0)
        .max(50)
        .integer()
        .required()
        .messages(experienceYearJoiMessage),
    bio: joi.string().max(500).allow("").messages(bioJoiMessage)
});
