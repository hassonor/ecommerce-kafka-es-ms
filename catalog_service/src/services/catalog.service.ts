import {ICatalogRepository} from "../interface/catalogRepository.interface";
import {Product} from "../models/product.model";
import {OrderWithLineItems} from "../types/message.type";
import {logger} from "../utils";

export class CatalogService {
    private _repository: ICatalogRepository;

    constructor(repository: ICatalogRepository) {
        this._repository = repository;
    }

    async createProduct(input: any) {
        const data = await this._repository.create(input);
        if (!data.id) {
            throw new Error("unable to create product");
        }
        return data;
    }

    async updateProduct(input: any) {
        const data = await this._repository.update(input);
        if (!data.id) {
            throw new Error("unable to update product");
        }
        // emit event to update record in Elastic search
        return data;
    }


    // instead of this we will get products from Elasticsearch
    async getProducts(limit: number, offset: number) {
        const products = await this._repository.find(limit, offset);

        return products;
    }

    async getProduct(id: number) {
        const product = await this._repository.findOne(id);
        return product;
    }

    async deleteProduct(id: number) {
        const response = await this._repository.delete(id);
        // delete record from Elasticsearch
        return response;
    }

    async getProductStock(ids: number[]) {
        const products = await this._repository.findStock(ids);
        if (!products) {
            throw new Error("unable to find product stock details");
        }
        return products;
    }

    async handleBrokerMessage(message: any) {
        console.log("Catalog Service received message", message);
        const orderData = message.data?.orderInput as OrderWithLineItems;
        if (!orderData || !Array.isArray(orderData.orderItems)) {
            logger.error("Invalid order message: orderItems is not iterable or missing", {message});
        }
        const {orderItems} = orderData;
        for (const item of orderItems) {
            console.log("Updating stock for product", item.productId, item.qty);
            const product = await this.getProduct(item.productId);
            if (!product) {
                logger.error("Product not found during stock update for create order", item.productId);
            } else {
                // update stock
                const updatedStock = product.stock - item.qty;
                await this.updateProduct({...product, stock: updatedStock})
            }
        }
    }
}