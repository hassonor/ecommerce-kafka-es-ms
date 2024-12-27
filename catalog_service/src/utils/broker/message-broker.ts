import {MessageBrokerType, MessageHandler, PublishType} from "./broker.type";
import {Consumer, Kafka, logLevel, Partitioners, Producer} from "kafkajs";
import {logger} from "../logger";
import {MessageType, CatalogEvent, TOPIC_TYPE} from "../../types";
import {BROKERS_ENV} from "../../config";

// configuration properties
const CLIENT_ID = process.env.CLIENT_ID || "catalog-service";
const GROUP_ID = process.env.GROUP_ID || "catalog-service-group";


const kafka = new Kafka({
    clientId: CLIENT_ID,
    brokers: BROKERS_ENV,
    logLevel: logLevel.INFO
});

let producer: Producer | null = null;
let consumer: Consumer | null = null;

const createTopic = async (topicsToCreate: string[]) => {
    const topics = topicsToCreate.map((t) => ({
        topic: t,
        numPartitions: 2,
        replicationFactor: 3, // Adjust based on your cluster configuration
    }));

    const admin = kafka.admin();
    await admin.connect();

    // Listing existing topics
    const existingTopics = await admin.listTopics();
    logger.info("Existing topics:", {existingTopics});

    // Creating only non-existing topics
    for (const t of topics) {
        if (!existingTopics.includes(t.topic)) {
            await admin.createTopics({
                topics: [t],
            });
            logger.info(`Created topic: ${t.topic}`);
        } else {
            logger.info(`Topic already exists: ${t.topic}`);
        }
    }
    await admin.disconnect();
};

const connectProducer = async <T>(): Promise<T> => {
    await createTopic(["CatalogEvents"]);

    if (producer) {
        logger.info("Producer already connected with existing connection");
        return producer as unknown as T;
    }

    producer = kafka.producer({
        createPartitioner: Partitioners.DefaultPartitioner,
    });

    await producer.connect();
    logger.info("Producer connected with a new connection");
    return producer as unknown as T;
};

const disconnectProducer = async (): Promise<void> => {
    if (producer) {
        await producer.disconnect();
        producer = null;
    }
};

const publish = async (data: PublishType): Promise<boolean> => {
    const producer = await connectProducer<Producer>();
    const result = await producer.send({
        topic: data.topic,
        messages: [
            {
                headers: data.headers,
                key: data.event,
                value: JSON.stringify(data.message),
            },
        ],
    });

    logger.info("Publishing result", {result});
    return result.length > 0;
};

const connectConsumer = async <T>(): Promise<T> => {
    if (consumer) {
        logger.info("Consumer already connected with existing connection");
        return consumer as unknown as T;
    }

    consumer = kafka.consumer({
        groupId: GROUP_ID,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
    });

    await consumer.connect();
    logger.info("Consumer connected with a new connection");
    return consumer as unknown as T;
};

const disconnectConsumer = async (): Promise<void> => {
    if (consumer) {
        await consumer.disconnect();
        consumer = null;
    }
};

const subscribe = async (
    messageHandler: MessageHandler,
    topic: TOPIC_TYPE
): Promise<void> => {
    const consumer = await connectConsumer<Consumer>();
    await consumer.subscribe({topic: topic, fromBeginning: true});

    await consumer.run({
        eachMessage: async ({topic, partition, message}) => {
            if (!["CatalogEvents", "otherEvents"].includes(topic)) {
                return;
            }

            if (message.key && message.value) {
                const inputMessage: MessageType = {
                    headers: message.headers,
                    event: message.key.toString() as CatalogEvent,
                    data: JSON.parse(message.value.toString()),
                };
                await messageHandler(inputMessage);
                await consumer.commitOffsets([
                    {topic, partition, offset: (Number(message.offset) + 1).toString()},
                ]);
            }
        },
    });
};

export const MessageBroker: MessageBrokerType = {
    connectProducer,
    disconnectProducer,
    publish,
    connectConsumer,
    disconnectConsumer,
    subscribe,
};
