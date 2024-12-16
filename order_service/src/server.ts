import {ExpressApp} from "./express-app";


const PORT = process.env.APP_PORT || 9000;

export const StartServer = async () => {
    const expressApp = await ExpressApp();
    expressApp.listen(PORT, () => {
        console.info(`App is listening to ${PORT}`);
    });

    process.on("uncaughtException", async (err) => {
        console.error(err);
        process.exit(1);
    });
};

StartServer().then(() => {
    console.info("server is up");
});