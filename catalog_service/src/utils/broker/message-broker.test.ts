/**
 * message-broker.test.ts
 */

// 1) Declare your mock refs
let mockAdmin: any;
let mockProducer: any;
let mockConsumer: any;
let mockKafka: any;

/**
 * 2) Mock "kafkajs" immediately so Jest hoists it properly.
 *    We define local objects and assign them to the references above.
 */
jest.mock("kafkajs", () => {
    const mockAdminLocal = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        listTopics: jest.fn().mockResolvedValue([]),
        createTopics: jest.fn(),
    };

    const mockProducerLocal = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        // By default, mock a successful "send" returning an array with one item
        send: jest.fn().mockResolvedValue([{topicName: "CatalogEvents"}]),
        on: jest.fn(),
    };

    const mockConsumerLocal = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        subscribe: jest.fn(),
        run: jest.fn().mockResolvedValue(undefined),
        commitOffsets: jest.fn(),
        on: jest.fn(),
    };

    const mockKafkaLocal = {
        admin: jest.fn(() => mockAdminLocal),
        producer: jest.fn(() => mockProducerLocal),
        consumer: jest.fn(() => mockConsumerLocal),
    };

    // Assign them to the top-level variables so we can reference them in tests
    mockAdmin = mockAdminLocal;
    mockProducer = mockProducerLocal;
    mockConsumer = mockConsumerLocal;
    mockKafka = mockKafkaLocal;

    // Return the mock module
    return {
        Kafka: jest.fn(() => mockKafkaLocal),
        Partitioners: {
            DefaultPartitioner: jest.fn(),
        },
        logLevel: {
            ERROR: 1,
            WARN: 2,
            INFO: 4,
            DEBUG: 5,
        },
    };
});

// 3) Mock your logger if needed
jest.mock("../logger", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

// 4) Now import your code under test (after the mocks)
import {Producer, Consumer} from "kafkajs";
import {MessageBroker} from "./message-broker";
import {MessageBrokerType} from "./broker.type";
import {CatalogEvent} from "../../types"; // or your real event type

describe("MessageBroker Tests", () => {
    let broker: MessageBrokerType;

    beforeEach(() => {
        // Clear all calls to your mocks
        jest.clearAllMocks();
        // Re-instantiate the broker for each test
        broker = MessageBroker;
    });

    /*************************************************************
     * connectProducer
     *************************************************************/
    describe("connectProducer (combined test)", () => {
        it("should connect producer once and reuse if already connected", async () => {
            // 1) First call => we expect a real connect + admin steps
            const producerInstance = await broker.connectProducer<Producer>();

            // Admin checks
            expect(mockAdmin.connect).toHaveBeenCalledTimes(1);
            expect(mockAdmin.listTopics).toHaveBeenCalledTimes(1);
            expect(mockAdmin.createTopics).toHaveBeenCalledTimes(1);
            expect(mockAdmin.disconnect).toHaveBeenCalledTimes(1);

            // Producer checks
            expect(mockProducer.connect).toHaveBeenCalledTimes(1);
            expect(producerInstance).toBe(mockProducer);

            // 2) Second call => re-using the existing producer
            const secondProducer = await broker.connectProducer<Producer>();
            expect(secondProducer).toBe(producerInstance);
            // No additional connect call
            expect(mockProducer.connect).toHaveBeenCalledTimes(1);
        });
    });

    /*************************************************************
     * disconnectProducer
     *************************************************************/
    describe("disconnectProducer", () => {
        it("should disconnect if producer exists", async () => {
            await broker.connectProducer<Producer>();
            await broker.disconnectProducer();

            expect(mockProducer.disconnect).toHaveBeenCalled();
        });

        it("should do nothing if producer is null", async () => {
            // no existing producer => should not throw
            await broker.disconnectProducer();
        });
    });

    /*************************************************************
     * publish
     *************************************************************/
    describe("publish", () => {
        it("should publish a message with a valid event", async () => {
            const data = {
                headers: {"x-test": "true"},
                topic: "CatalogEvents" as const, // matches your code in message-broker.ts
                event: "ORDER_CREATED" as CatalogEvent, // or your real event
                message: {foo: "bar"},
            };

            const result = await broker.publish(data);
            expect(result).toBe(true);

            expect(mockProducer.send).toHaveBeenCalledWith({
                topic: "CatalogEvents",
                messages: [
                    {
                        headers: {"x-test": "true"},
                        key: "ORDER_CREATED",
                        value: JSON.stringify({foo: "bar"}),
                    },
                ],
            });
        });

        it("should return false if producer.send() returns an empty array", async () => {
            mockProducer.send.mockResolvedValueOnce([]);

            const data = {
                headers: {},
                topic: "CatalogEvents" as const,
                event: "ORDER_CREATED" as CatalogEvent,
                message: {},
            };
            const result = await broker.publish(data);
            expect(result).toBe(false);
        });
    });

    /*************************************************************
     * connectConsumer
     *************************************************************/
    describe("connectConsumer", () => {
        it("should connect consumer once", async () => {
            const c1 = await broker.connectConsumer<Consumer>();
            const c2 = await broker.connectConsumer<Consumer>();
            expect(c1).toBe(c2);
            expect(mockConsumer.connect).toHaveBeenCalledTimes(1);
        });
    });

    /*************************************************************
     * disconnectConsumer
     *************************************************************/
    describe("disconnectConsumer", () => {
        it("should disconnect if consumer is present", async () => {
            await broker.connectConsumer<Consumer>();
            await broker.disconnectConsumer();
            expect(mockConsumer.disconnect).toHaveBeenCalled();
        });

        it("should do nothing if consumer is null", async () => {
            // no consumer => pass
            await broker.disconnectConsumer();
        });
    });

    /*************************************************************
     * subscribe
     *************************************************************/
    describe("subscribe", () => {
        it('should subscribe to "CatalogEvents" and process messages', async () => {
            const handler = jest.fn();
            // You subscribe to CatalogEvents
            await broker.subscribe(handler, "CatalogEvents");

            expect(mockConsumer.subscribe).toHaveBeenCalledWith({
                topic: "CatalogEvents",
                fromBeginning: true,
            });
            expect(mockConsumer.run).toHaveBeenCalledWith({
                eachMessage: expect.any(Function),
            });

            // Simulate a message with topic = "CatalogEvents"
            const {eachMessage} = (mockConsumer.run as jest.Mock).mock.calls[0][0];
            await eachMessage({
                topic: "CatalogEvents",
                partition: 0,
                message: {
                    key: Buffer.from("ORDER_CREATED"),
                    value: Buffer.from(JSON.stringify({orderId: 999})),
                    headers: {"test-header": "true"},
                    offset: "0",
                },
            });

            // The handler should receive the parsed message
            expect(handler).toHaveBeenCalledWith({
                headers: {"test-header": "true"},
                event: "ORDER_CREATED",
                data: {orderId: 999},
            });

            // The consumer commits offset => "1"
            expect(mockConsumer.commitOffsets).toHaveBeenCalledWith([
                {topic: "CatalogEvents", partition: 0, offset: "1"},
            ]);
        });

        it("should ignore messages if topic is not CatalogEvents", async () => {
            const handler = jest.fn();
            await broker.subscribe(handler, "CatalogEvents");

            const {eachMessage} = (mockConsumer.run as jest.Mock).mock.calls[0][0];
            await eachMessage({
                topic: "AnotherTopic",
                partition: 0,
                message: {
                    key: Buffer.from("ORDER_CREATED"),
                    value: Buffer.from("{}"),
                    headers: {},
                    offset: "0",
                },
            });

            // Handler is never called
            expect(handler).not.toHaveBeenCalled();
        });
    });
});
