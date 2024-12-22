/**
 * cart.repository.test.ts
 */
import {DB} from '../db/db.connection';
import {CartRepository} from './cart.repository';
import {carts, cartLineItems} from '../db/schema';
import {eq} from 'drizzle-orm';
import {NotFoundError} from '../utils';

// Mock the DB object so we don't make real DB calls
jest.mock('../db/db.connection', () => ({
    DB: {
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        query: {
            carts: {
                findFirst: jest.fn(),
            },
        },
    },
}));

describe('CartRepository', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    /****************************************************************
     * createCart
     ****************************************************************/
    describe('createCart', () => {
        it('should insert a new cart and then insert a line item', async () => {
            // 1) For inserting into "carts"
            const mockInsertCarts = {
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue({
                        onConflictDoUpdate: jest.fn().mockReturnValue([{id: 555}]),
                    }),
                }),
            };
            (DB.insert as jest.Mock).mockImplementationOnce(() => mockInsertCarts);

            // 2) For inserting into "cartLineItems"
            const mockInsertLineItems = {
                values: jest.fn().mockReturnValue(undefined),
            };
            (DB.insert as jest.Mock).mockImplementationOnce(() => mockInsertLineItems);

            // Provide a full CartLineItem object, including cartId (though
            // for new line items, cartId can be overwritten by the DB logic).
            // TypeScript requires it because CartLineItem has cartId as non-optional.
            const testLineItem = {
                id: 0, // Will be assigned by DB in real scenario
                cartId: 0, // Placeholder until we know the real cartId
                productId: 123,
                itemName: 'Smart Phone',
                price: '1200',
                qty: 2,
                variant: 'Standard',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await CartRepository.createCart(999, testLineItem);
            expect(result).toBe(555);

            // The first insert is for the "carts" table
            expect(DB.insert).toHaveBeenCalledWith(carts);
            expect(mockInsertCarts.values).toHaveBeenCalledWith({
                customerId: 999,
            });

            // The second insert is for "cart_line_items"
            expect(DB.insert).toHaveBeenCalledWith(cartLineItems);
            // cartId is set to the newly created cart ID (555)
            expect(mockInsertLineItems.values).toHaveBeenCalledWith({
                cartId: 555,
                productId: 123,
                itemName: 'Smart Phone',
                price: '1200',
                qty: 2,
                variant: 'Standard',
            });
        });

        it('should NOT insert a line item if the returned cart id <= 0', async () => {
            // Return an ID of 0 => skip line item insert
            const mockInsertCarts = {
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue({
                        onConflictDoUpdate: jest.fn().mockReturnValue([{id: 0}]),
                    }),
                }),
            };
            (DB.insert as jest.Mock).mockImplementationOnce(() => mockInsertCarts);

            // If the repository tries to call DB.insert second time,
            // we can throw an error to fail the test
            (DB.insert as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Should not insert line item if cartId is 0');
            });

            const testLineItem = {
                id: 1,
                cartId: 1,
                productId: 123,
                itemName: 'Smart Phone',
                price: '1200',
                qty: 2,
                variant: 'Standard',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await CartRepository.createCart(999, testLineItem);
            expect(result).toBe(0);

            // Only 1 insert call => second one never called
            expect(DB.insert).toHaveBeenCalledTimes(1);
        });
    });

    /****************************************************************
     * findCart
     ****************************************************************/
    describe('findCart', () => {
        it('should return the found cart', async () => {
            const mockCart = {
                id: 1,
                customerId: 123,
                createdAt: new Date(),
                updatedAt: new Date(),
                lineItems: [
                    {
                        id: 10,
                        cartId: 1,
                        productId: 222,
                        itemName: 'Laptop',
                        price: '3000',
                        qty: 1,
                        variant: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
            };

            (DB.query.carts.findFirst as jest.Mock).mockResolvedValueOnce(mockCart);

            const result = await CartRepository.findCart(123);
            expect(result).toBe(mockCart);

            // We expect the "where" eq(carts.customerId, 123)
            expect(DB.query.carts.findFirst).toHaveBeenCalledWith({
                where: expect.any(Function),
                with: {lineItems: true},
            });
        });

        it('should throw NotFoundError if cart not found', async () => {
            (DB.query.carts.findFirst as jest.Mock).mockResolvedValueOnce(null);

            await expect(CartRepository.findCart(999)).rejects.toThrow(NotFoundError);
        });
    });

    /****************************************************************
     * updateCart
     ****************************************************************/
    describe('updateCart', () => {
        it('should update the line item qty and return the updated item', async () => {
            const mockUpdatedItem = {
                id: 10,
                cartId: 1,
                productId: 123,
                itemName: 'Smart Phone',
                price: '1200',
                qty: 5,
                variant: 'Standard',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockUpdate = {
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockReturnValue([mockUpdatedItem]),
                    }),
                }),
            };
            (DB.update as jest.Mock).mockReturnValueOnce(mockUpdate);

            const result = await CartRepository.updateCart(10, 5);
            expect(result).toEqual(mockUpdatedItem);

            expect(DB.update).toHaveBeenCalledWith(cartLineItems);
            expect(mockUpdate.set).toHaveBeenCalledWith({qty: 5});
            expect(mockUpdate.set().where).toHaveBeenCalledWith(eq(cartLineItems.id, 10));
        });

        it('should return undefined if no rows are updated', async () => {
            const mockUpdate = {
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockReturnValue([]),
                    }),
                }),
            };
            (DB.update as jest.Mock).mockReturnValueOnce(mockUpdate);

            const result = await CartRepository.updateCart(9999, 10);
            expect(result).toBeUndefined();
        });
    });

    /****************************************************************
     * deleteCart
     ****************************************************************/
    describe('deleteCart', () => {
        it('should delete the line item and return true', async () => {
            const mockDelete = {
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue([]),
                }),
            };
            (DB.delete as jest.Mock).mockReturnValueOnce(mockDelete);

            const result = await CartRepository.deleteCart(10);
            expect(result).toBe(true);

            expect(DB.delete).toHaveBeenCalledWith(cartLineItems);
            expect(mockDelete.where).toHaveBeenCalledWith(eq(cartLineItems.id, 10));
        });
    });

    /****************************************************************
     * clearCartData
     ****************************************************************/
    describe('clearCartData', () => {
        it('should delete the cart record and return true', async () => {
            const mockDelete = {
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue([]),
                }),
            };
            (DB.delete as jest.Mock).mockReturnValueOnce(mockDelete);

            const result = await CartRepository.clearCartData(111);
            expect(result).toBe(true);

            expect(DB.delete).toHaveBeenCalledWith(carts);
            expect(mockDelete.where).toHaveBeenCalledWith(eq(carts.id, 111));
        });
    });

    /****************************************************************
     * findCartByProductId
     ****************************************************************/
    describe('findCartByProductId', () => {
        it('should return the line item if it exists', async () => {
            const mockCart = {
                id: 22,
                customerId: 222,
                createdAt: new Date(),
                updatedAt: new Date(),
                lineItems: [
                    {
                        id: 101,
                        cartId: 22,
                        productId: 123,
                        itemName: 'Smart Phone',
                        price: '1200',
                        qty: 2,
                        variant: 'Standard',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
            };

            (DB.query.carts.findFirst as jest.Mock).mockResolvedValueOnce(mockCart);

            const result = await CartRepository.findCartByProductId(222, 123);
            expect(result).toEqual(mockCart.lineItems[0]);
        });

        it('should return undefined if the cart is not found', async () => {
            (DB.query.carts.findFirst as jest.Mock).mockResolvedValueOnce(null);

            const result = await CartRepository.findCartByProductId(999, 123);
            expect(result).toBeUndefined();
        });

        it('should return undefined if no matching productId in lineItems', async () => {
            const mockCart = {
                id: 50,
                customerId: 555,
                createdAt: new Date(),
                updatedAt: new Date(),
                lineItems: [
                    {
                        id: 999,
                        cartId: 50,
                        productId: 888,
                        itemName: 'Other Item',
                        price: '777',
                        qty: 1,
                        variant: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
            };
            (DB.query.carts.findFirst as jest.Mock).mockResolvedValueOnce(mockCart);

            const result = await CartRepository.findCartByProductId(555, 1234);
            expect(result).toBeUndefined();
        });
    });
});
