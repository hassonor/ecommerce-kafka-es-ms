import {ICatalogRepository} from "../interface/catalogRepository.interface";
import {Product} from "../models/product.model";

/**
 * A mock repository for testing CatalogService without hitting the real database.
 */
export class MockCatalogRepository implements ICatalogRepository {
    create(data: Product): Promise<Product> {
        // Return the "created" product with an auto-generated ID for test verification.
        const mockProduct: Product = {
            id: 123,
            ...data,
        };
        return Promise.resolve(mockProduct);
    }

    update(data: Product): Promise<Product> {
        // Return the updated product for test verification.
        return Promise.resolve(data as Product);
    }

    delete(id: number) {
        // Return the ID of the deleted product for test verification.
        return Promise.resolve({id});
    }

    find(limit: number, offset: number): Promise<Product[]> {
        // Return an empty list by default.
        return Promise.resolve([]);
    }

    findOne(id: number): Promise<Product> {
        // Return a product with the given ID for test verification.
        const mockProduct: Product = {
            id,
            name: "Mock Product",
            description: "Mock Description",
            price: 100,
            stock: 10,
        };
        return Promise.resolve(mockProduct);
    }

    findStock(ids: number[]): Promise<Product[]> {
        // Return an empty list by default.
        return Promise.resolve([]);
    }
}
