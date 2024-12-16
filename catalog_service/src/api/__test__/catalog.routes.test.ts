import request from 'supertest';
import express from 'express';
import {faker} from '@faker-js/faker';
import catalogRoutes, {catalogService} from "../catalog.routes";
import {describe} from "node:test";
import {ProductFactory} from "../../utils/fixtures";
import {CatalogService} from "../../services/catalog.service";

const app = express();
app.use(express.json());
app.use(catalogRoutes);

const mockRequest = () => {
    return {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        stock: faker.number.int({min: 10, max: 200}),
        price: +faker.commerce.price()
    }
}

describe("Catalog Routes", () => {
    describe("POST /products/:id", () => {
        test("should create product successfully", async () => {
            const requestBody = mockRequest();
            const product = ProductFactory.build();
            jest.spyOn(catalogService, 'createProduct')
                .mockImplementationOnce(() => Promise.resolve(product))
            const response = await request(app)
                .post("/products")
                .send(requestBody)
                .set("Accept", "application/json");
            expect(response.status).toBe(201);
            expect(response.body).toEqual(product);
        })

        test("should response with validation error 400", async () => {
            const requestBody = mockRequest();

            const response = await request(app)
                .post("/products")
                .send({...requestBody, name: ""})
                .set("Accept", "application/json");
            expect(response.status).toBe(400);
            expect(response.body).toEqual("name should not be empty");
        })

        test("should response with an internal error code 500", async () => {
            const requestBody = mockRequest();
            jest.spyOn(catalogService, 'createProduct')
                .mockImplementationOnce(() => Promise.reject(new Error("error occurred on create product")))
            const response = await request(app)
                .post("/products")
                .send(requestBody)
                .set("Accept", "application/json");
            expect(response.status).toBe(500);
            expect(response.body).toEqual("error occurred on create product");
        })
    })
    describe("PATCH /products/:id", () => {
        test("should update product successfully", async () => {
            const product = ProductFactory.build();
            const requestBody = {
                name: product.name,
                price: product.price,
                stock: product.stock,
            };
            jest
                .spyOn(catalogService, "updateProduct")
                .mockImplementationOnce(() => Promise.resolve(product));
            const response = await request(app)
                .patch(`/products/${product.id}`)
                .send(requestBody)
                .set("Accept", "application/json");
            expect(response.status).toBe(200);
            expect(response.body).toEqual(product);
        });

        test("should response with validation error 400", async () => {
            const product = ProductFactory.build();
            const requestBody = {
                name: product.name,
                price: -1,
                stock: product.stock,
            };
            const response = await request(app)
                .patch(`/products/${product.id}`)
                .send({...requestBody})
                .set("Accept", "application/json");
            expect(response.status).toBe(400);
            expect(response.body).toEqual("price must not be less than 1");
        });

        test("should response with an internal error code 500", async () => {
            const product = ProductFactory.build();
            const requestBody = mockRequest();
            jest
                .spyOn(catalogService, "updateProduct")
                .mockImplementationOnce(() =>
                    Promise.reject(new Error("unable to update product"))
                );
            const response = await request(app)
                .patch(`/products/${product.id}`)
                .send(requestBody)
                .set("Accept", "application/json");
            expect(response.status).toBe(500);
            expect(response.body).toEqual("unable to update product");
        });
    });
    describe("GET /products?limit=0&offset=0", () => {
        test("should return a range of products based on limit and offset", async () => {
            const randomLimit = faker.number.int({min: 1, max: 50})
            const products = ProductFactory.buildList(randomLimit);
            jest
                .spyOn(catalogService, "getProducts")
                .mockImplementationOnce(() => Promise.resolve(products));
            const response = await request(app)
                .get(`/products?limit=${randomLimit}&offset=0`)
                .set("Accept", "application/json");
            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
        });

        test("should respond with validation error 400 for invalid query params", async () => {
            // Here we pass a negative limit to cause validation error
            const response = await request(app)
                .get(`/products?limit=-1&offset=0`)
                .set("Accept", "application/json");

            expect(response.status).toBe(400);
            expect(response.body).toEqual("limit must be a positive number");
        });


        test("should respond with internal error code 500", async () => {
            jest.spyOn(catalogService, "getProducts")
                .mockImplementationOnce(() => Promise.reject(new Error("unable to fetch products")));

            const response = await request(app)
                .get(`/products?limit=10&offset=0`)
                .set("Accept", "application/json");

            expect(response.status).toBe(500);
            expect(response.body).toEqual("unable to fetch products");
        });
    });
    describe("GET /products/:id", () => {
        test("should return a product by id", async () => {
            const product = ProductFactory.build();
            jest
                .spyOn(catalogService, "getProduct")
                .mockImplementationOnce(() => Promise.resolve(product));

            const response = await request(app)
                .get(`/products/${product.id}`)
                .set("Accept", "application/json");

            expect(response.status).toBe(200);
            expect(response.body).toEqual(product);
        });

        test("should respond with validation error 400 when id is not positive", async () => {
            // Using id = 0 or negative number to trigger validation error
            const response = await request(app)
                .get("/products/0")
                .set("Accept", "application/json");

            expect(response.status).toBe(400);
            expect(response.body).toEqual("id must be a positive number");
        });

        test("should respond with internal error 500 if getProduct fails", async () => {
            jest.spyOn(catalogService, "getProduct")
                .mockImplementationOnce(() => Promise.reject(new Error("unable to fetch product")));

            const product = ProductFactory.build(); // using product.id for convenience
            const response = await request(app)
                .get(`/products/${product.id}`)
                .set("Accept", "application/json");

            expect(response.status).toBe(500);
            expect(response.body).toEqual("unable to fetch product");
        });
    });
    describe("DELETE /products/:id", () => {
        test("should delete a product by id", async () => {
            const product = ProductFactory.build();
            jest
                .spyOn(catalogService, "deleteProduct")
                .mockImplementationOnce(() => Promise.resolve({id: product.id}));
            const response = await request(app)
                .delete(`/products/${product.id}`)
                .set("Accept", "application/json");
            expect(response.status).toBe(200);
            expect(response.body).toEqual({id: product.id});
        });

        test("should respond with validation error 400 when id is not positive", async () => {
            // Using id = 0 or negative number to trigger validation error
            const response = await request(app)
                .delete("/products/0")
                .set("Accept", "application/json");

            expect(response.status).toBe(400);
            expect(response.body).toEqual("id must be a positive number");
        });

        test("should respond with internal error 500 if deleteProduct fails", async () => {
            jest.spyOn(catalogService, "deleteProduct")
                .mockImplementationOnce(() => Promise.reject(new Error("unable to delete product")));

            const product = ProductFactory.build();
            const response = await request(app)
                .delete(`/products/${product.id}`)
                .set("Accept", "application/json");

            expect(response.status).toBe(500);
            expect(response.body).toEqual("unable to delete product");
        });
    });
})
