export type OrderLineItemType = {
    id: number;
    productId: number;
    itemName: string;
    qty: number;
    price: number;
    orderId: number;
    createdAt: Date;
    updatedAt: Date;
}


export interface OrderWithLineItems {
    id?: number;
    customerId: number;
    orderId: number;
    txId: string | null;
    amount: string;
    status: string;
    orderItems: OrderLineItemType[];
    createdAt?: Date;
    updatedAt?: Date;
}