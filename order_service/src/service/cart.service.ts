import {CartEditRequestInput, CartRequestInput} from "../dto/cartRequest.dto";
import {GetProductDetails} from "../utils";
import {logger, NotFoundError} from "../utils";
import {CartRepositoryType} from "../repository/cart.repository";
import {CartLineItem} from "../db/schema";

export const CreateCart = async (input: CartRequestInput, repo: CartRepositoryType) => {

    // make a call to our catalog microservice
    // synchronize call
    const product = await GetProductDetails(input.productId);
    logger.info(product);
    if (product.stock < input.qty) {
        throw new NotFoundError("product is out of stock");
    }

    return await repo.createCart(input.customerId, {
        productId: product.id,
        price: product.price.toString(),
        qty: input.qty,
        itemName: product.name,
        variant: product.variant
    } as CartLineItem)

}


export const GetCart = async (id: number, repo: CartRepositoryType) => {
    const data = await repo.findCart(id);
    if (!data) {
        throw new NotFoundError("cart is out of stock");
    }
    return data;
}


export const EditCart = async (input: CartEditRequestInput, repo: CartRepositoryType) => {
    const data = await repo.updateCart(input.productId, input.qty);
    return data;
}

export const DeleteCart = async (id: number, repo: CartRepositoryType) => {
    const data = await repo.deleteCart(id);
    return data;
}