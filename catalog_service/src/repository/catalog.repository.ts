import {ICatalogRepository} from "../interface/catalogRepository.interface";
import {Product} from "../models/product.model";

export class CatalogRepository implements ICatalogRepository {
    create(data: Product): Promise<Product> {
        return Promise.resolve(data);
    }

    delete(id: any): Promise<void> {
        return Promise.resolve(id);
    }

    find(): Promise<Product[]> {
        return Promise.resolve([]);
    }

    findOne(id: number): Promise<Product | undefined | null> {
        return Promise.resolve(undefined);
    }

    update(data: Product): Promise<Product> {
        return Promise.resolve(data);
    }

}