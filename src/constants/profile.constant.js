export const lookingFor = [
    "job",
    "freelance",
    "cofounder",
    "collaboration",
    "mentor",
    "mentee",
    "networking",
    "dating"
];

export const techStacks = [
    // languages
    "javascript",
    "typescript",
    "python",
    "java",
    "c",
    "cpp",
    "csharp",
    "go",
    "rust",
    "php",
    "ruby",
    "kotlin",
    "swift",
    "dart",
    "scala",

    // frontend
    "html",
    "css",
    "react",
    "nextjs",
    "vue",
    "nuxt",
    "angular",
    "svelte",
    "tailwind",
    "bootstrap",
    "redux",
    "vite",

    // backend
    "node",
    "express",
    "nestjs",
    "fastify",
    "django",
    "flask",
    "fastapi",
    "spring",
    "laravel",
    "rails",
    "dotnet",
    "gin",

    // database
    "mongodb",
    "postgresql",
    "mysql",
    "sqlite",
    "redis",
    "elasticsearch",
    "cassandra",
    "firebase",
    "dynamodb",

    // mobile
    "android",
    "ios",
    "reactnative",
    "flutter",
    "xamarin",

    // devops / cloud
    "docker",
    "kubernetes",
    "aws",
    "gcp",
    "azure",
    "terraform",
    "ansible",
    "github-actions",
    "gitlab-ci",
    "jenkins",
    "nginx",

    // data / ml
    "pandas",
    "numpy",
    "tensorflow",
    "pytorch",
    "scikit-learn",
    "opencv",
    "spark",
    "hadoop",

    // security
    "oauth",
    "jwt",
    "sso",
    "webauthn",
    "passkeys",
    "cryptography",

    // tools
    "git",
    "github",
    "gitlab",
    "bitbucket",
    "postman",
    "swagger",
    "figma",
    "linux"
];

export const role = [
    "frontend",
    "backend",
    "fullstack",
    "mobile",
    "devops",
    "data",
    "ml",
    "game",
    "security",
    "student",
    "other"
];

// message

export const experienceYearJoiMessage = {
    "any.required": "experienceYears is required.",
    "number.min": "experienceYears cannot less than 0.",
    "number.max": "experienceYears cannot exceed 50 years.",
    "number.integer": "experienceYears must be a whole number.",
    "number.base": "experienceYears must be a valid number"
};

export const techStackJoiMessage = {
    "any.required": "techStack is required.",
    "array.min": "At least one tech stack is required.",
    "array.unique": "Duplicate tech stack values are not allowed.",
    "any.only": `Only allowed tech stacks: ${techStacks.join(", ")}`
};

export const lookingForJoiMessage = {
    "any.required": "lookingFor is required.",
    "array.min": "At least one looking for is required.",
    "array.unique": "Duplicate looking for values are not allowed.",
    "any.only": `Only allowed looking for: ${lookingFor.join(", ")}`
};

export const roleJoiMessage = {
    "any.required": "role is required.",
    "string.empty": "role cannot be empty."
};

export const displayNameJoiMessage = {
    "any.required": "displayName is required.",
    "string.base": "displayName must be a valid string.",
    "string.empty": "displayName cannot be empty."
};

export const bioJoiMessage = {
    "string.base": "bio must be a valid string.",
    "string.max": "bio cannot exceed 500 characters."
};
