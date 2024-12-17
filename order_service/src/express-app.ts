import express, {NextFunction, Request, Response} from "express";
import cors from "cors";
import orderRoutes from "./routes/order.routes";
import cartRoutes from "./routes/cart.routes";
import {HandleErrorWithLogger, httpLogger} from "./utils";


export const ExpressApp = async () => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(httpLogger);

    app.use(orderRoutes)
    app.use(cartRoutes);

    app.get("/", (req: Request, res: Response): any => {
        return res.status(200).json({message: "I am healthy!"});
    });

    app.use(HandleErrorWithLogger);


    return app;
};