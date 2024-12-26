import {logger, MessageBroker} from "../utils";
import {Consumer, Producer} from "kafkajs";
import {HandleSubscription} from "./order.service";
import {OrderEvent} from "../types";

export const InitializeBrokers = async () => {
    const producer = await MessageBroker.connectProducer<Producer>();
    producer.on("producer.connect", async () => {
        logger.info("Producer connected successfully.");
    });

    const consumer = await MessageBroker.connectConsumer<Consumer>();
    consumer.on("consumer.connect", async () => {
        logger.info("Consumer connected successfully.");
    });

    // keep listening to consumers events
    // perform the action based on the event
    await MessageBroker.subscribe(HandleSubscription, "OrderEvents");
}


// publish dedicated events based on use-cases
export const SendCreateOrderMessage = async (data: any) => {
    await MessageBroker.publish({
        event: OrderEvent.CREATE_ORDER,
        topic: "CatalogEvents",
        headers: {},
        message: data,
    })
}

export const SendOrderCanceledMessage = async (data: any) => {
    await MessageBroker.publish({
        event: OrderEvent.CANCEL_ORDER,
        topic: "CatalogEvents",
        headers: {},
        message: data
    })
}
