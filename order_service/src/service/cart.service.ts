import {CartRepositoryType} from "../types/repository.type";
import {CartRequestInput} from "../dto/cartRequest.dto";
import {GetProductDetails} from "../utils/broker";
import {logger, NotFoundError} from "../utils";

export const CreateCart = async (input: CartRequestInput, repo: CartRepositoryType) => {

    // make a call to our catalog microservice
    // synchronize call
    const product = await GetProductDetails(input.productId);
    logger.info(product);
    if (product.stock < input.qty) {
        throw new NotFoundError("product is out of stock");
    }

    // const data = await repo.create(input);
    return product;
}


export const GetCart = async (input: any, repo: CartRepositoryType) => {
    const data = await repo.find(input);
    return data;
}


export const EditCart = async (input: any, repo: CartRepositoryType) => {
    const data = await repo.update(input);
    return data;
}

export const DeleteCart = async (input: any, repo: CartRepositoryType) => {
    const data = await repo.delete(input);
    return data;
}