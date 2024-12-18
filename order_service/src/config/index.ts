import dotenv from 'dotenv';

dotenv.config();

export const DATABASE_URL = process.env.DATABASE_URL;
export const APP_PORT = process.env.APP_PORT;


export const PORT = process.env.APP_PORT || "9000";
export const CLIENT_ID = process.env.CLIENT_ID || "order-service";
export const GROUP_ID = process.env.GROUP_ID || "order-service-group";
// Provide a default if not set, but in production, you should ensure BROKERS is always defined
export const BROKERS_ENV = process.env.BROKERS ? process.env.BROKERS.split(",") : ["localhost:29092", "localhost:39092", "localhost:49092"];