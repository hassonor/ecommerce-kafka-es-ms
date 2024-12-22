// catalog.repository.test.ts

import {PrismaClient} from "@prisma/client";
import {CatalogRepository} from "../catalog.repository";
import {Product} from "../../models/product.model";
import {NotFoundError} from "../../utils";


jest.mock('@prisma/client', () => {
    const mockProduct = {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
    };

    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            product: mockProduct,
        })),
    };
});

describe('CatalogRepository', () => {
    let mockPrismaClient: any;
    let catalogRepository: CatalogRepository;

    beforeAll(() => {
        mockPrismaClient = new PrismaClient();
        catalogRepository = new CatalogRepository();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new product', async () => {
        const productData = new Product('Test', 'Desc', 100, 10);
        mockPrismaClient.product.create.mockResolvedValue(productData);

        const result = await catalogRepository.create(productData);

        expect(mockPrismaClient.product.create).toHaveBeenCalledWith({data: productData});
        expect(result).toBe(productData);
    });

    it('should update an existing product', async () => {
        const productData = new Product('Updated', 'New desc', 150, 5, 1);
        mockPrismaClient.product.update.mockResolvedValue(productData);

        const result = await catalogRepository.update(productData);

        expect(mockPrismaClient.product.update).toHaveBeenCalledWith({
            where: {id: productData.id},
            data: productData,
        });
        expect(result).toBe(productData);
    });

    it('should delete a product by id', async () => {
        const deletedProduct = new Product('Deleted', 'Desc', 200, 0, 10);
        mockPrismaClient.product.delete.mockResolvedValue(deletedProduct);

        const result = await catalogRepository.delete(10);

        expect(mockPrismaClient.product.delete).toHaveBeenCalledWith({
            where: {id: 10},
        });
        expect(result).toBe(deletedProduct);
    });

    it('should find a list of products', async () => {
        const mockProducts = [
            new Product('A', 'A desc', 10, 1),
            new Product('B', 'B desc', 20, 2),
        ];
        mockPrismaClient.product.findMany.mockResolvedValue(mockProducts);

        const result = await catalogRepository.find(2, 0);

        expect(mockPrismaClient.product.findMany).toHaveBeenCalledWith({
            take: 2,
            skip: 0,
        });
        expect(result).toEqual(mockProducts);
    });

    it('should find one product by id', async () => {
        const mockProduct = new Product('Single', 'One desc', 300, 30, 11);
        mockPrismaClient.product.findFirst.mockResolvedValue(mockProduct);

        const result = await catalogRepository.findOne(11);

        expect(mockPrismaClient.product.findFirst).toHaveBeenCalledWith({
            where: {id: 11},
        });
        expect(result).toBe(mockProduct);
    });

    it('should throw NotFoundError if product is not found', async () => {
        mockPrismaClient.product.findFirst.mockResolvedValue(null);

        await expect(catalogRepository.findOne(9999)).rejects.toThrowError(NotFoundError);
    });

    it('should find stock for multiple product ids', async () => {
        const mockProducts = [
            new Product('X', 'Stock desc X', 40, 4, 100),
            new Product('Y', 'Stock desc Y', 50, 5, 200),
        ];
        mockPrismaClient.product.findMany.mockResolvedValue(mockProducts);

        const ids = [100, 200];
        const result = await catalogRepository.findStock(ids);

        expect(mockPrismaClient.product.findMany).toHaveBeenCalledWith({
            where: {
                id: {in: ids},
            },
        });
        expect(result).toEqual(mockProducts);
    });
});
