/**
 * cart.service.test.ts
 */
import {CreateCart, GetCart, EditCart, DeleteCart} from './cart.service';
import {CartRepositoryType} from '../repository/cart.repository';
import {CartRequestInput, CartEditRequestInput} from '../dto/cartRequest.dto';
import {NotFoundError, AuthorizeError} from '../utils';

// Mock any external calls (GetProductDetails, GetStockDetails, logger)
jest.mock('../utils', () => ({
    ...jest.requireActual('../utils'),
    // Mock product details from external API
    GetProductDetails: jest.fn().mockResolvedValue({
        id: 123,
        price: 1200,
        stock: 10,
        name: 'Smart Phone',
        variant: 'Standard',
    }),
    // Mock inventory/stock details from external API
    GetStockDetails: jest.fn().mockResolvedValue([
        {
            id: 123,
            price: 1200,
            stock: 10,
            name: 'Smart Phone',
            variant: 'Standard',
        },
    ]),
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe('Cart Service', () => {
    let repo: CartRepositoryType;

    beforeEach(() => {
        // Mock repository implementation
        repo = {
            createCart: jest.fn(),
            findCart: jest.fn(),
            updateCart: jest.fn(),
            deleteCart: jest.fn(),
            clearCartData: jest.fn(),
            findCartByProductId: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /*********************************************************************
     * TESTS FOR CreateCart
     *********************************************************************/
    describe('CreateCart', () => {
        it('should create a new cart line item if product is in stock and not yet in cart', async () => {
            // Input to the service
            const mockInput: CartRequestInput & { customerId: number } = {
                productId: 123,
                qty: 2,
                customerId: 456,
            };

            // No existing line item found
            (repo.findCartByProductId as jest.Mock).mockResolvedValueOnce(undefined);

            // createCart returns an ID
            (repo.createCart as jest.Mock).mockResolvedValueOnce(999);

            const result = await CreateCart(mockInput, repo);
            expect(result).toBe(999);

            // Repo calls
            expect(repo.findCartByProductId).toHaveBeenCalledWith(456, 123);
            expect(repo.createCart).toHaveBeenCalledWith(
                456,
                expect.objectContaining({
                    productId: 123,
                    qty: 2,
                    price: '1200',
                    itemName: 'Smart Phone',
                    variant: 'Standard',
                })
            );
        });

        it('should throw NotFoundError if requested qty exceeds stock', async () => {
            // The "GetProductDetails" mock by default returns stock:10
            const mockInput: CartRequestInput & { customerId: number } = {
                productId: 123,
                qty: 20, // more than available
                customerId: 456,
            };

            await expect(CreateCart(mockInput, repo)).rejects.toThrow(NotFoundError);
            expect(repo.findCartByProductId).not.toHaveBeenCalled();
            expect(repo.createCart).not.toHaveBeenCalled();
        });

        it('should update quantity if the product already exists in cart', async () => {
            const mockInput: CartRequestInput & { customerId: number } = {
                productId: 123,
                qty: 3,
                customerId: 456,
            };
            // The existing line item
            const existingLineItem = {
                id: 777,
                productId: 123,
                qty: 2,
                price: '1200',
                itemName: 'Smart Phone',
                variant: 'Standard',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (repo.findCartByProductId as jest.Mock).mockResolvedValueOnce(
                existingLineItem
            );
            // The updateCart result (just returning the updated item)
            (repo.updateCart as jest.Mock).mockResolvedValueOnce({
                ...existingLineItem,
                qty: 5,
            });

            const result = await CreateCart(mockInput, repo);
            expect(result).toEqual({
                ...existingLineItem,
                qty: 5,
            });
            expect(repo.updateCart).toHaveBeenCalledWith(existingLineItem.id, 5);
        });
    });

    /*********************************************************************
     * TESTS FOR GetCart
     *********************************************************************/
    describe('GetCart', () => {
        it('should return cart data if cart exists and has line items', async () => {
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
                        price: '1200',
                        itemName: 'Smart Phone',
                        variant: 'Standard',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
            };

            (repo.findCart as jest.Mock).mockResolvedValueOnce(mockCart);

            const result = await GetCart(456, repo);
            expect(result).toBe(mockCart);
            expect(repo.findCart).toHaveBeenCalledWith(456);

            // The service tries to fetch stock details (mocked)
            // The service then populates lineItem.availability from the result
            expect(result.lineItems[0].availability).toBe(10);
        });

        it('should throw NotFoundError if the cart does not exist', async () => {
            (repo.findCart as jest.Mock).mockResolvedValueOnce(null);

            await expect(GetCart(999, repo)).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError if the cart has no line items', async () => {
            (repo.findCart as jest.Mock).mockResolvedValueOnce({
                id: 2,
                customerId: 111,
                createdAt: new Date(),
                updatedAt: new Date(),
                lineItems: [], // no items
            });

            await expect(GetCart(111, repo)).rejects.toThrow(NotFoundError);
        });
    });

    /*********************************************************************
     * TESTS FOR EditCart
     *********************************************************************/
    describe('EditCart', () => {
        it('should update cart line item qty if authorized', async () => {
            // The cart must contain a matching line item to be authorized
            (repo.findCart as jest.Mock).mockResolvedValueOnce({
                id: 1,
                customerId: 456,
                lineItems: [
                    {
                        id: 10,
                        productId: 123,
                        qty: 2,
                    },
                ],
            });

            const updatedLineItem = {
                id: 10,
                productId: 123,
                qty: 5,
                price: '1200',
                itemName: 'Smart Phone',
                variant: 'Standard',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (repo.updateCart as jest.Mock).mockResolvedValueOnce(updatedLineItem);

            const input: CartEditRequestInput & { customerId: number } = {
                id: 10,
                qty: 5,
                customerId: 456,
            };

            const result = await EditCart(input, repo);
            expect(result).toEqual(updatedLineItem);
            expect(repo.findCart).toHaveBeenCalledWith(456);
            expect(repo.updateCart).toHaveBeenCalledWith(10, 5);
        });

        it('should throw AuthorizeError if line item does not belong to the cart', async () => {
            // Cart is found, but it doesn't have a line item with id: 999
            (repo.findCart as jest.Mock).mockResolvedValueOnce({
                id: 1,
                customerId: 456,
                lineItems: [
                    {
                        id: 10,
                        productId: 123,
                        qty: 2,
                    },
                ],
            });

            const input = {
                id: 999,
                qty: 5,
                customerId: 456,
            };

            await expect(EditCart(input, repo)).rejects.toThrow(AuthorizeError);
            expect(repo.updateCart).not.toHaveBeenCalled();
        });
    });

    /*********************************************************************
     * TESTS FOR DeleteCart
     *********************************************************************/
    describe('DeleteCart', () => {
        it('should delete the cart line item if authorized', async () => {
            // Must have a matching line item for authorization
            (repo.findCart as jest.Mock).mockResolvedValueOnce({
                id: 1,
                customerId: 456,
                lineItems: [
                    {
                        id: 10,
                        productId: 123,
                        qty: 2,
                    },
                ],
            });

            (repo.deleteCart as jest.Mock).mockResolvedValueOnce(true);

            const result = await DeleteCart({id: 10, customerId: 456}, repo);
            expect(result).toBe(true);
            expect(repo.findCart).toHaveBeenCalledWith(456);
            expect(repo.deleteCart).toHaveBeenCalledWith(10);
        });

        it('should throw AuthorizeError if line item does not belong to the cart', async () => {
            (repo.findCart as jest.Mock).mockResolvedValueOnce({
                id: 1,
                customerId: 456,
                lineItems: [
                    {
                        id: 10,
                        productId: 123,
                        qty: 2,
                    },
                ],
            });

            await expect(
                DeleteCart({id: 999, customerId: 456}, repo)
            ).rejects.toThrow(AuthorizeError);

            expect(repo.deleteCart).not.toHaveBeenCalled();
        });
    });
});
