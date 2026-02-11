import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

const SERVICE_PATH = isProd
    ? "/etc/secrets/serviceAccountKey.json"
    : path.resolve("env/serviceAccountKey.json");

const serviceAccountKey = fs.readFileSync(SERVICE_PATH, "utf8");

const serviceAccount = admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountKey))
});

export default admin;
