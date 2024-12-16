import {ICatalogRepository} from "../interface/catalogRepository.interface";
import {Product} from "../models/product.model";
import {PrismaClient, Prisma} from "@prisma/client";

export class CatalogRepository implements ICatalogRepository {
    private _prisma: PrismaClient;

    constructor() {
        this._prisma = new PrismaClient();
    }

    async create(data: Product): Promise<Product> {
        try {
            const product = await this._prisma.product.create({data});
            return product;
        } catch (error: any) {
            this.handlePrismaError(error, "Unable to create product");
        }
    }

    async update(data: Product): Promise<Product> {
        try {
            const product = await this._prisma.product.update({
                where: {id: data.id},
                data
            });
            return product;
        } catch (error: any) {
            this.handlePrismaError(error, `Unable to update product with id ${data.id}`);
        }
    }

    async delete(id: number): Promise<any> {
        try {
            return await this._prisma.product.delete({
                where: {id}
            });
        } catch (error: any) {
            this.handlePrismaError(error, `Unable to delete product with id ${id}`);
        }
    }

    async find(limit: number, offset: number): Promise<Product[]> {
        try {
            return await this._prisma.product.findMany({
                take: limit,
                skip: offset
            });
        } catch (error: any) {
            this.handlePrismaError(error, "Unable to fetch products");
        }
    }

    async findOne(id: number): Promise<Product | undefined | null> {
        try {
            const product = await this._prisma.product.findFirst({
                where: {id}
            });

            if (!product) {
                throw new Error("product not found");
            }

            return product;
        } catch (error: any) {
            if (error.message === "product not found") {
                // This is our custom error if no product is found.
                throw error;
            }

            this.handlePrismaError(error, `Unable to fetch product with id ${id}`);
        }
    }

    private handlePrismaError(error: any, defaultMessage: string): never {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle known Prisma errors
            if (error.code === "P2025") {
                // Record not found error
                throw new Error("Record not found");
            }
            // Add handling for other known error codes as needed
        }

        // Log the error for debugging
        console.error("Prisma error:", error);

        // Throw a generic error message
        throw new Error(defaultMessage);
    }
}
