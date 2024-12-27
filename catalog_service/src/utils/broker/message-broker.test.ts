/**
 * message-broker.test.ts
 */
import {Producer, Consumer} from 'kafkajs';
import {CatalogEvent} from '../../types';
import {MessageBroker} from './message-broker';
import {MessageBrokerType} from './broker.type';

// ----- Mock logger -----
jest.mock('../logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

// ----- Declare global mock vars -----
var mockAdmin: any;
var mockProducer: any;
var mockConsumer: any;
var mockKafka: any;

// ----- Mock kafkajs -----
jest.mock('kafkajs', () => {
    mockAdmin = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        listTopics: jest.fn().mockResolvedValue([]),
        createTopics: jest.fn(),
    };
    mockProducer = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn().mockResolvedValue([{topicName: 'OrderEvents'}]),
        on: jest.fn(),
    };
    mockConsumer = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        subscribe: jest.fn(),
        run: jest.fn().mockResolvedValue(undefined),
        commitOffsets: jest.fn(),
        on: jest.fn(),
    };
    mockKafka = {
        admin: jest.fn(() => mockAdmin),
        producer: jest.fn(() => mockProducer),
        consumer: jest.fn(() => mockConsumer),
    };

    return {
        Kafka: jest.fn(() => mockKafka),
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

// ------------- TEST SUITE -------------
describe('MessageBroker Tests', () => {
    let broker: MessageBrokerType;

    beforeEach(() => {
        jest.clearAllMocks();
        broker = MessageBroker;
    });

    /*************************************************************
     * connectProducer
     *************************************************************/
    describe('connectProducer (combined test)', () => {
        it('should connect producer once and reuse if already connected', async () => {
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
    describe('disconnectProducer', () => {
        it('should disconnect if producer exists', async () => {
            await broker.connectProducer<Producer>();
            await broker.disconnectProducer();

            expect(mockProducer.disconnect).toHaveBeenCalled();
        });

        it('should do nothing if producer is null', async () => {
            await broker.disconnectProducer();
            // No error => pass
        });
    });

    /*************************************************************
     * publish
     *************************************************************/
    describe('publish', () => {
        it('should publish a message with a valid OrderEvent', async () => {
            const data = {
                headers: {'x-test': 'true'},
                topic: 'OrderEvents' as const,
                event: 'ORDER_CREATED' as CatalogEvent,
                message: {foo: 'bar'},
            };

            const result = await broker.publish(data);
            expect(result).toBe(true);

            expect(mockProducer.send).toHaveBeenCalledWith({
                topic: 'OrderEvents',
                messages: [
                    {
                        headers: {'x-test': 'true'},
                        key: 'ORDER_CREATED',
                        value: JSON.stringify({foo: 'bar'}),
                    },
                ],
            });
        });

        it('should return false if producer.send() returns an empty array', async () => {
            mockProducer.send.mockResolvedValueOnce([]);

            const data = {
                headers: {},
                topic: 'OrderEvents' as const,
                event: 'ORDER_CREATED' as CatalogEvent,
                message: {},
            };
            const result = await broker.publish(data);
            expect(result).toBe(false);
        });
    });

    /*************************************************************
     * connectConsumer
     *************************************************************/
    describe('connectConsumer', () => {
        it('should connect consumer once', async () => {
            const c1 = await broker.connectConsumer<Consumer>();
            const c2 = await broker.connectConsumer<Consumer>();
            expect(c1).toBe(c2);

            expect(mockConsumer.connect).toHaveBeenCalledTimes(1);
        });
    });

    /*************************************************************
     * disconnectConsumer
     *************************************************************/
    describe('disconnectConsumer', () => {
        it('should disconnect if consumer is present', async () => {
            await broker.connectConsumer<Consumer>();
            await broker.disconnectConsumer();

            expect(mockConsumer.disconnect).toHaveBeenCalled();
        });

        it('should do nothing if consumer is null', async () => {
            await broker.disconnectConsumer();
            // pass
        });
    });

    /*************************************************************
     * subscribe
     *************************************************************/
    describe('subscribe', () => {
        it('should subscribe to "OrderEvents" and process messages', async () => {
            const handler = jest.fn();
            await broker.subscribe(handler, 'OrderEvents');

            expect(mockConsumer.subscribe).toHaveBeenCalledWith({
                topic: 'OrderEvents',
                fromBeginning: true,
            });
            expect(mockConsumer.run).toHaveBeenCalledWith({
                eachMessage: expect.any(Function),
            });

            // Simulate a message
            const {eachMessage} = (mockConsumer.run as jest.Mock).mock.calls[0][0];
            await eachMessage({
                topic: 'OrderEvents',
                partition: 0,
                message: {
                    key: Buffer.from('ORDER_CREATED'),
                    value: Buffer.from(JSON.stringify({orderId: 999})),
                    headers: {'test-header': 'true'},
                    offset: '0',
                },
            });

            expect(handler).toHaveBeenCalledWith({
                headers: {'test-header': 'true'},
                event: 'ORDER_CREATED',
                data: {orderId: 999},
            });
            expect(mockConsumer.commitOffsets).toHaveBeenCalledWith([
                {topic: 'OrderEvents', partition: 0, offset: '1'},
            ]);
        });

        it('should ignore messages if topic is not "OrderEvents"', async () => {
            const handler = jest.fn();
            await broker.subscribe(handler, 'OrderEvents');

            const {eachMessage} = (mockConsumer.run as jest.Mock).mock.calls[0][0];
            await eachMessage({
                topic: 'AnotherTopic',
                partition: 0,
                message: {
                    key: Buffer.from('ORDER_CREATED'),
                    value: Buffer.from('{}'),
                    headers: {},
                    offset: '0',
                },
            });

            // Handler is never called
            expect(handler).not.toHaveBeenCalled();
        });
    });
});
