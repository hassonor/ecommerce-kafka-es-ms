import {describe, test, beforeEach, afterEach, expect, jest} from "@jest/globals";
import {ICatalogRepository} from "../../interface/catalogRepository.interface";
import {MockCatalogRepository} from "../../repository/mockCatalog.repository";
import {CatalogService} from "../catalog.service";
import {faker} from "@faker-js/faker";
import {Product} from "../../models/product.model";
import {ProductFactory} from "../../utils";

/**
 * Helper to generate a random product-like object.
 */
const mockProduct = (rest: Partial<Product> = {}): Product => {
    return {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        stock: faker.number.int({min: 10, max: 200}),
        price: +faker.commerce.price(),
        ...rest,
    } as Product;
};

describe("CatalogService", () => {
    let repository: ICatalogRepository;

    beforeEach(() => {
        repository = new MockCatalogRepository();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        repository = {} as MockCatalogRepository;
    });

    describe("createProduct", () => {
        test("should create product", async () => {
            const service = new CatalogService(repository);
            const reqBody = mockProduct();

            const result = await service.createProduct(reqBody);

            expect(result).toMatchObject({
                id: expect.any(Number),
                name: expect.any(String),
                description: expect.any(String),
                price: expect.any(Number),
                stock: expect.any(Number),
            });
        });

        test("should throw error if unable to create product (missing id)", async () => {
            const service = new CatalogService(repository);
            const reqBody = mockProduct();

            jest.spyOn(repository, "create").mockResolvedValue({} as Product);

            await expect(service.createProduct(reqBody)).rejects.toThrow("unable to create product");
        });

        test("should throw error if product already exist", async () => {
            const service = new CatalogService(repository);
            const reqBody = mockProduct();

            jest.spyOn(repository, "create").mockRejectedValue(new Error("product already exist"));

            await expect(service.createProduct(reqBody)).rejects.toThrow("product already exist");
        });
    });

    describe("updateProduct", () => {
        test("should update product", async () => {
            const service = new CatalogService(repository);
            const reqBody = mockProduct({
                id: faker.number.int({min: 10, max: 1000}),
            });

            const result = await service.updateProduct(reqBody);
            // Casting here to avoid TS2345
            expect(result).toMatchObject(reqBody as any);
        });

        test("should throw error with product does not exist", async () => {
            const service = new CatalogService(repository);

            jest.spyOn(repository, "update").mockRejectedValue(new Error("product does not exist"));

            await expect(service.updateProduct({})).rejects.toThrow("product does not exist");
        });
    });

    describe("getProducts", () => {
        test("should get products by offset and limit", async () => {
            const service = new CatalogService(repository);
            const randomLimit = faker.number.int({min: 1, max: 50});
            const products = ProductFactory.buildList(randomLimit);

            jest.spyOn(repository, "find").mockResolvedValue(products);

            const result = await service.getProducts(randomLimit, 0);

            expect(result.length).toEqual(randomLimit);
            // Casting here to avoid TS2345
            expect(result).toMatchObject(products as any);
        });

        test("should throw error if products does not exist", async () => {
            const service = new CatalogService(repository);

            jest.spyOn(repository, "find").mockRejectedValue(new Error("products does not exist"));

            await expect(service.getProducts(0, 0)).rejects.toThrow("products does not exist");
        });
    });

    describe("getProduct", () => {
        test("should get product by id", async () => {
            const service = new CatalogService(repository);
            const product = ProductFactory.build();

            jest.spyOn(repository, "findOne").mockResolvedValue(product);

            const result = await service.getProduct(product.id!);

            expect(result).toEqual(product);
        });
    });

    describe("deleteProduct", () => {
        test("should delete product by id", async () => {
            const service = new CatalogService(repository);
            const product = ProductFactory.build();

            jest.spyOn(repository, "delete").mockResolvedValue({id: product.id});

            const result = await service.deleteProduct(product.id!);

            expect(result).toMatchObject({
                id: product.id,
            });
        });
    });

    describe("getProductStock", () => {
        test("should get product stock details by IDs", async () => {
            const service = new CatalogService(repository);
            const randomCount = faker.number.int({min: 1, max: 5});
            const productIds = Array.from({length: randomCount}).map(() =>
                faker.number.int({min: 1, max: 1000})
            );
            const products = ProductFactory.buildList(randomCount);

            jest.spyOn(repository, "findStock").mockResolvedValue(products);

            const result = await service.getProductStock(productIds);

            expect(result).toEqual(products);
        });

        test("should throw error if unable to find product stock details", async () => {
            const service = new CatalogService(repository);

            jest.spyOn(repository, "findStock").mockResolvedValue(null as unknown as Product[]);

            await expect(service.getProductStock([])).rejects.toThrow("unable to find product stock details");
        });
    });
});
