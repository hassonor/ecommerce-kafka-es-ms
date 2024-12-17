import {defineConfig} from "drizzle-kit";
import {DATABASE_URL} from "./src/config";

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema/*",
    out: "./src/db/migrations",
    dbCredentials: {
        url: DATABASE_URL,
    },
    verbose: true,
    strict: true
});
