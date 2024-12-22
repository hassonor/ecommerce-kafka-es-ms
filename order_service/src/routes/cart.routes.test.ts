// cart.routes.test.ts

import request from 'supertest';
import express, {Express} from 'express';

// The router we want to test
import cartRouter from './cart.routes';

// Mock the cart service so we don't hit the real service/db
import * as cartService from '../service/cart.service';

// Mock the middlewares so we can bypass real auth checks
import {RequestAuthorizer, UserGuard} from './middlewares';

// Tell Jest to replace the actual implementations of these modules
jest.mock('../service/cart.service', () => ({
    CreateCart: jest.fn(),
    GetCart: jest.fn(),
    EditCart: jest.fn(),
    DeleteCart: jest.fn(),
}));

jest.mock('./middlewares', () => ({
    RequestAuthorizer: jest.fn((req, res, next) => next()),
    UserGuard: jest.fn((req, res, next) => {
        // Simulate a logged-in user with ID 123
        req.user = {id: 123};
        next();
    }),
}));

describe('cart.routes integration tests', () => {
    let app: Express;

    beforeAll(() => {
        // Create a test Express app
        app = express();
        app.use(express.json());

        // Mount the router at root for testing
        app.use('/', cartRouter);

        // NOTE: If you have a custom error handler, you could add it here:
        // app.use((err, req, res, next) => { ... });
    });

    afterEach(() => {
        // Reset mocks between tests
        jest.clearAllMocks();
    });

    /*********************************************************************
     * POST /cart
     *********************************************************************/
    describe('POST /cart', () => {
        it('should create a cart item and return status 200 + response body on success', async () => {
            // Mock the service call
            (cartService.CreateCart as jest.Mock).mockResolvedValueOnce(999);

            const payload = {productId: 111, qty: 2};
            const res = await request(app).post('/cart').send(payload).expect(200);

            // Check response
            expect(res.body).toBe(999);

            // Verify the service was called with merged input + user ID
            expect(cartService.CreateCart).toHaveBeenCalledWith(
                {
                    productId: 111,
                    qty: 2,
                    customerId: 123, // from the UserGuard mock
                },
                expect.anything() // The repo instance
            );
        });

        it('should return 400 if validation fails (missing productId or qty)', async () => {
            // This payload is missing productId
            const invalidPayload = {qty: 2};

            const res = await request(app).post('/cart').send(invalidPayload).expect(400);

            // We expect an error in res.body
            expect(res.body).toHaveProperty('error');

            // Service should not be called
            expect(cartService.CreateCart).not.toHaveBeenCalled();
        });

        it('should pass errors to next() if the service throws', async () => {
            // Suppose the service throws some error
            (cartService.CreateCart as jest.Mock).mockRejectedValueOnce(
                new Error('Service failed')
            );

            const validPayload = {productId: 111, qty: 2};
            const res = await request(app).post('/cart').send(validPayload);

            // By default, without a custom error handler, Express sends 500
            expect(res.status).toBe(500);

            // The body might be an empty object or custom error response, depending on your setup
            // For default Express, it's typically {}
            expect(res.body).toEqual({});
        });
    });

    /*********************************************************************
     * GET /cart
     *********************************************************************/
    describe('GET /cart', () => {
        it('should return 200 and the cart data on success', async () => {
            const mockCart = {
                id: 1,
                customerId: 123,
                lineItems: [{id: 10, productId: 111, qty: 2}],
            };

            (cartService.GetCart as jest.Mock).mockResolvedValueOnce(mockCart);

            const res = await request(app).get('/cart').expect(200);

            expect(res.body).toEqual(mockCart);
            expect(cartService.GetCart).toHaveBeenCalledWith(123, expect.anything());
        });

        it('should return 500 if the service throws an error', async () => {
            (cartService.GetCart as jest.Mock).mockRejectedValueOnce(
                new Error('Service error')
            );

            const res = await request(app).get('/cart');

            expect(res.status).toBe(500);
            expect(res.body).toEqual({});
        });
    });

    /*********************************************************************
     * PATCH /cart/:lineItemId
     *********************************************************************/
    describe('PATCH /cart/:lineItemId', () => {
        it('should update an existing line item and return 200 on success', async () => {
            const updatedLineItem = {id: 10, qty: 5, productId: 111};
            (cartService.EditCart as jest.Mock).mockResolvedValueOnce(updatedLineItem);

            const res = await request(app)
                .patch('/cart/10')
                .send({qty: 5})
                .expect(200);

            // Confirm the response
            expect(res.body).toEqual(updatedLineItem);

            // Check the service call
            expect(cartService.EditCart).toHaveBeenCalledWith(
                {
                    id: 10,        // from URL param
                    qty: 5,        // from body
                    customerId: 123, // from UserGuard
                },
                expect.anything()
            );
        });

        it('should return 500 if the EditCart service rejects', async () => {
            (cartService.EditCart as jest.Mock).mockRejectedValueOnce(new Error('Nope'));

            const res = await request(app).patch('/cart/10').send({qty: 3});

            expect(res.status).toBe(500);
            expect(res.body).toEqual({});
        });
    });

    /*********************************************************************
     * DELETE /cart/:lineItemId
     *********************************************************************/
    describe('DELETE /cart/:lineItemId', () => {
        it('should delete a line item and return 200 on success', async () => {
            (cartService.DeleteCart as jest.Mock).mockResolvedValueOnce(true);

            const res = await request(app).delete('/cart/20').expect(200);

            expect(res.body).toBe(true);
            // Service call must have the correct ID + user ID
            expect(cartService.DeleteCart).toHaveBeenCalledWith(
                {id: 20, customerId: 123},
                expect.anything()
            );
        });

        it('should return 500 if the service rejects', async () => {
            (cartService.DeleteCart as jest.Mock).mockRejectedValueOnce(
                new Error('Unauthorized')
            );

            const res = await request(app).delete('/cart/20');

            expect(res.status).toBe(500);
            expect(res.body).toEqual({});
        });
    });
});
