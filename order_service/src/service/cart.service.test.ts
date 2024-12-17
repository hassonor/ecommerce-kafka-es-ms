import {CartRepositoryType} from "../repository/cart.repository";
import * as Repository from "../repository/cart.repository";
import {CreateCart, GetCart, EditCart, DeleteCart} from "./cart.service";
import {NotFoundError} from "../utils";
import {CartRequestInput, CartEditRequestInput} from "../dto/cartRequest.dto";

// Mock GetProductDetails so it doesn't call external API
jest.mock("../utils", () => ({
    ...jest.requireActual("../utils"),
    GetProductDetails: jest.fn().mockResolvedValue({
        id: 123,
        price: 1200,
        stock: 10,
        name: "Smart Phone",
        variant: "Standard",
    }),
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    }
}));

describe("Cart Service", () => {
    let repo: CartRepositoryType;

    beforeEach(() => {
        // Provide a default mock implementation for each repo method.
        repo = {
            createCart: jest.fn(),
            findCart: jest.fn(),
            updateCart: jest.fn(),
            deleteCart: jest.fn(),
            clearCartData: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("CreateCart", () => {
        it("should create a cart successfully", async () => {
            const mockInput: CartRequestInput = {
                productId: 123,
                customerId: 456,
                qty: 2,
            };

            // Mock createCart to return a fake cart ID
            (repo.createCart as jest.Mock).mockResolvedValue(999);

            const result = await CreateCart(mockInput, repo);
            expect(result).toBe(999);
            expect(repo.createCart).toHaveBeenCalledWith(
                456, // customerId
                expect.objectContaining({
                    productId: 123,
                    qty: 2,
                    itemName: "Smart Phone",
                    variant: "Standard",
                    price: "1200",
                })
            );
        });

        it("should throw NotFoundError if product is out of stock", async () => {
            const mockInput: CartRequestInput = {
                productId: 123,
                customerId: 456,
                qty: 20, // More than available stock
            };

            await expect(CreateCart(mockInput, repo)).rejects.toThrow(NotFoundError);
        });
    });

    describe("GetCart", () => {
        it("should return cart data if it exists", async () => {
            const mockCart = {
                id: 1,
                customerId: 456,
                createdAt: new Date(),
                updatedAt: new Date(),
                lineItems: [
                    {
                        id: 10,
                        productId: 123,
                        qty: 2,
                        price: "1200",
                        itemName: "Smart Phone",
                        variant: "Standard",
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                ]
            };
            (repo.findCart as jest.Mock).mockResolvedValue(mockCart);

            const result = await GetCart(456, repo);
            expect(result).toBe(mockCart);
            expect(repo.findCart).toHaveBeenCalledWith(456);
        });

        it("should throw NotFoundError if cart not found", async () => {
            (repo.findCart as jest.Mock).mockRejectedValue(new NotFoundError("cart not found"));

            await expect(GetCart(999, repo)).rejects.toThrow(NotFoundError);
        });
    });

    describe("EditCart", () => {
        it("should update cart line item qty and return updated line item", async () => {
            const mockInput: CartEditRequestInput = {
                productId: 123,
                qty: 5,
            };
            const updatedLineItem = {
                id: 10,
                cartId: 1,
                productId: 123,
                qty: 5,
                price: "1200",
                itemName: "Smart Phone",
                variant: "Standard",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (repo.updateCart as jest.Mock).mockResolvedValue(updatedLineItem);

            const result = await EditCart(mockInput, repo);
            expect(result).toEqual(updatedLineItem);
            expect(repo.updateCart).toHaveBeenCalledWith(123, 5);
        });

        it("should handle cases where line item not found (depending on your repo logic)", async () => {
            (repo.updateCart as jest.Mock).mockResolvedValue(undefined);

            const mockInput: CartEditRequestInput = {
                productId: 999,
                qty: 5,
            };

            const result = await EditCart(mockInput, repo);
            expect(result).toBeUndefined();
        });
    });

    describe("DeleteCart", () => {
        it("should delete the cart line item and return true", async () => {
            (repo.deleteCart as jest.Mock).mockResolvedValue(true);

            const result = await DeleteCart(10, repo);
            expect(result).toBe(true);
            expect(repo.deleteCart).toHaveBeenCalledWith(10);
        });

        it("should return true even if line item does not exist (based on repo mock)", async () => {
            (repo.deleteCart as jest.Mock).mockResolvedValue(true);

            const result = await DeleteCart(999, repo);
            expect(result).toBe(true);
            expect(repo.deleteCart).toHaveBeenCalledWith(999);
        });
    });
});
