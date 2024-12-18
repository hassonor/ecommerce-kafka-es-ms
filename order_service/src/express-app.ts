import express, {NextFunction, Request, Response} from "express";
import cors from "cors";
import orderRoutes from "./routes/order.routes";
import cartRoutes from "./routes/cart.routes";
import {HandleErrorWithLogger, httpLogger, logger} from "./utils";
import {MessageBroker} from "./utils";
import {Consumer, Producer} from "kafkajs";


export const ExpressApp = async () => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(httpLogger);

    // 1st step: connect to the producer and consumer
    const producer = await MessageBroker.connectProducer<Producer>();
    producer.on("producer.connect", () => {
        logger.info("producer connected");
    })

    const consumer = await MessageBroker.connectConsumer<Consumer>();
    consumer.on("consumer.connect", () => {
        logger.info("consumer connected");
    })

    // 2nd step: subscribe to the topic or publish the message
    await MessageBroker.subscribe((message) => {
        logger.info("Consumer received the message");
        console.log("Message received", message);

    }, "OrderEvents");

    app.use(orderRoutes)
    app.use(cartRoutes);

    app.get("/", (req: Request, res: Response): any => {
        return res.status(200).json({message: "I am healthy!"});
    });

    app.use(HandleErrorWithLogger);


    return app;
};