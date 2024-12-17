import {NodePgDatabase, drizzle} from "drizzle-orm/node-postgres";
import {Pool} from "pg";
import * as schema from "./schema";
import {DATABASE_URL} from "../config";

const pool = new Pool({
    connectionString: DATABASE_URL,
});

export const DB: NodePgDatabase<typeof schema> = drizzle(pool, {schema});