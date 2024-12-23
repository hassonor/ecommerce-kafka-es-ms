import {OrderWithLineItems} from "../dto/orderRequest.dto";
import {DB} from "../db/db.connection";
import {orderLineItems, orders} from "../db/schema";
import {eq} from "drizzle-orm";

export type OrderRepositoryType = {
    createOrder: (lineItem: OrderWithLineItems) => Promise<number>;
    findOrder: (id: number) => Promise<OrderWithLineItems | null>;
    updateOrder: (id: number, status: string) => Promise<OrderWithLineItems>;
    deleteOrder: (id: number) => Promise<boolean>;
    findOrdersByCustomerId: (customerId: number) => Promise<OrderWithLineItems[]>;
};

/**
 * Creates a new order and its associated line items in the database.
 * @param lineItem - An object containing order information (customerId, orderNumber, etc.)
 *                   as well as the line items (items name, price, etc.).
 * @returns The ID of the newly created order.
 */
const createOrder = async (lineItem: OrderWithLineItems): Promise<number> => {
    // 1. Insert a new record into the `orders` table using values from `lineItem`.
    //    Drizzle's `.returning()` returns an array of the inserted rows (including auto-generated `id`).
    const result = await DB.insert(orders)
        .values({
            customerId: lineItem.customerId,  // The ID of the customer placing the order
            orderNumber: lineItem.orderNumber, // A unique number that identifies the order
            status: lineItem.status,           // Status of the order (e.g., "PENDING")
            txnId: lineItem.txnId,            // Transaction ID for the payment
            amount: lineItem.amount,          // Total amount for the order
        })
        .returning();

    // 2. Destructure the first element of the returned array to get the new order's `id`.
    //    For example, if `result` is [{ id: 123, ... }], this line sets `id` to 123.
    const [{id}] = result;

    // 3. If `id` is greater than 0, it means the order was inserted successfully.
    //    Next, insert each of the line items in `lineItem.orderItems` into the `orderLineItems` table,
    //    linking them to the newly created order ID.
    if (id > 0) {
        for (const item of lineItem.orderItems) {
            await DB.insert(orderLineItems)
                .values({
                    orderId: id,        // References the `id` of the parent order
                    itemName: item.itemName,
                    price: item.price,
                    qty: item.qty,
                })
                .execute();
        }
    }

    // 4. Return the newly created order's ID so the caller can use it (e.g., for fetching the order).
    return id;
};

const findOrder = async (id: number): Promise<OrderWithLineItems | null> => {
    const order = await DB.query.orders.findFirst({
        where: (orders, {eq}) => eq(orders.id, id),
        with: {
            lineItems: true,
        },
    });

    if (!order) {
        throw new Error("Order not found");
    }

    return order as unknown as OrderWithLineItems;
};

const updateOrder = async (
    id: number,
    status: string
): Promise<OrderWithLineItems> => {
    await DB.update(orders)
        .set({
            status: status,
        })
        .where(eq(orders.id, id))
        .execute();

    const order = await findOrder(id);
    if (!order) {
        throw new Error("Order not found");
    }
    return order;
};

const deleteOrder = async (id: number): Promise<boolean> => {
    await DB.delete(orders).where(eq(orders.id, id)).execute();
    return true;
};

const findOrdersByCustomerId = async (
    customerId: number
): Promise<OrderWithLineItems[]> => {
    const orders = await DB.query.orders.findMany({
        where: (orders, {eq}) => eq(orders.customerId, customerId),
        with: {
            lineItems: true,
        },
    });

    return orders as unknown as OrderWithLineItems[];
};

export const OrderRepository: OrderRepositoryType = {
    createOrder,
    findOrder,
    updateOrder,
    deleteOrder,
    findOrdersByCustomerId,
};