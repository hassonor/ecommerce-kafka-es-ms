import {Consumer, Producer} from "kafkajs";
import {CatalogService} from "./catalog.service";
import {logger} from "../utils";
import {MessageBroker} from "../utils/broker";

export class BrokerService {
    private producer: Producer | null = null;
    private consumer: Consumer | null = null;
    private catalogService: CatalogService;

    constructor(catalogService: CatalogService) {
        this.catalogService = catalogService;
    }

    public async initializeBroker() {
        this.producer = await MessageBroker.connectProducer<Producer>();
        this.producer.on("producer.connect", async () => {
            logger.info("Catalog Service Producer connected successfully.");
        });

        this.consumer = await MessageBroker.connectConsumer<Consumer>();
        this.consumer.on("consumer.connect", async () => {
            logger.info("Catalog Service Consumer connected successfully.");
        });

        // keep listening to consumers events
        // perform the action based on the event
        await MessageBroker.subscribe(this.catalogService.handleBrokerMessage.bind(this.catalogService), "CatalogEvents");
    }

    // publish discontinue product event
    public async sendDeleteProductMessage(data: any) {

    }


}