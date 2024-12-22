import {OrderRepositoryType} from "../repository/order.repository";
import {OrderWithLineItems} from "../dto/orderRequest.dto";
import {CartRepositoryType} from "../repository/cart.repository";

export const CreateOrder = async (
    userId: number,
    repo: OrderRepositoryType,
    cartRepo: CartRepositoryType) => {
    return {};
}

export const UpdateOrder = async (orderId: number, status: string, repo: OrderRepositoryType) => {
    return {};
}

export const GetOrder = async (orderId: number, repo: OrderRepositoryType) => {
    return {};
}

export const GetOrders = async (userId: number, repo: OrderRepositoryType) => {
    return {};
}


export const DeleteOrder = async (orderId: number, repo: OrderRepositoryType) => {
    return {};
}

export const HandleSubscription = async (message: any) => {
    // if (message.event == OrderEvent.ORDER_UPDATED){
    // call create order}
    return {}
}