import express, {Request, Response, NextFunction} from 'express';
import * as service from "../service/cart.service";
import * as repository from "../repository/cart.repository";
import {CartRequestInput, CartRequestSchema} from "../dto/cartRequest.dto";
import {ValidateRequest} from "../utils";


const router = express.Router();
const repo = repository.CartRepository

// TODO:  Implement a real autMiddleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    //jwt
    const isValidUser = true
    if (!isValidUser) {
        return res.status(403).json({error: "authorization error"});
    }
    next();
}

router.use(authMiddleware);

router.post("/cart", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const error = ValidateRequest<CartRequestInput>(req.body as CartRequestInput, CartRequestSchema);
        if (error) {
            return res.status(400).json({error});
        }

        const response = await service.CreateCart(req.body, repo);
        return res.status(200).json(response)
    } catch (error) {
        return res.status(404).json({error});
    }

})

router.get("/cart", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // comes from our auth user parsed from JWT
    const response = await service.GetCart(req.body.customerId, repo);
    return res.status(200).json(response)
})

router.patch("/cart/:lineItemId", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const liteItemId = req.params.lineItemId;
    const response = await service.EditCart({productId: +liteItemId, qty: req.body.qty}, repo);
    return res.status(200).json(response)
})

router.delete("/cart/:lineItemId", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const liteItemId = req.params.lineItemId;
    const response = await service.DeleteCart(+liteItemId, repo);
    return res.status(200).json(response)
})

export default router;