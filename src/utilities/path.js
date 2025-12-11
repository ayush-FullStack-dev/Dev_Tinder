import path from "path";

import { fileURLToPath } from "url";

function getdirName() {
    const __fileName = fileURLToPath(import.meta.url);

    const currentName = path.dirname(__fileName);

    return currentName;
}

const __dirName = getdirName();

const subFolder = path.dirname(__dirName);

const rootPath = path.dirname(subFolder);

const publicDir = path.join(rootPath, "public");

const logDir = path.join(rootPath, "log");

const envPath = path.join(rootPath, ".env");

export default {
    path,
    subFolder,
    rootPath,
    getdirName,
    __dirName,
    envPath,
    logDir,
    publicDir
};
