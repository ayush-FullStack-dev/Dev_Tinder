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
    bioJoiMessage,
    cityJoiMessage,
    countryJoiMessage
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

export const profilePatchValidator = joi.object({
    displayName: joi.string().trim().messages(displayNameJoiMessage),
    bio: joi.string().max(500).allow("").messages(bioJoiMessage),
    techStack: joi
        .array()
        .items(joi.string().valid(...techStacks))
        .min(1)
        .unique()
        .messages(techStackJoiMessage),
    lookingFor: joi
        .array()
        .items(joi.string().valid(...lookingFor))
        .min(1)
        .unique()
        .messages(lookingForJoiMessage),
    experienceYears: joi
        .number()
        .min(0)
        .max(50)
        .integer()
        .messages(experienceYearJoiMessage),
    location: joi.object({
        city: joi.string().required().messages(cityJoiMessage),
        country: joi.string().required().messages(countryJoiMessage)
    })
});
