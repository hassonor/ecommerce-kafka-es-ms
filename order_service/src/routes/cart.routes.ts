import express, {Request, Response, NextFunction} from 'express';
import * as service from "../service/cart.service";
import * as repository from "../repository/cart.repository";
import {CartRequestInput, CartRequestSchema} from "../dto/cartRequest.dto";
import {ValidateRequest} from "../utils/validator";


const router = express.Router();
const repo = repository.CartRepository

router.post("/cart", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const error = ValidateRequest<CartRequestInput>(req.body as CartRequestInput, CartRequestSchema);
        if (error) {
            return res.status(400).json({error});
        }

        const response = await service.CreateCart(req.body, repo);
        return res.status(200).json(response)
    } catch (error) {
        return res.status(400).json({error});
    }

})

router.get("/cart", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const response = await service.GetCart(req.body, repo);
    return res.status(200).json(response)
})

router.patch("/cart", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const response = await service.EditCart(req.body, repo);
    return res.status(200).json(response)
})

router.delete("/cart", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const response = await service.DeleteCart(req.body, repo);
    return res.status(200).json(response)
})

export default router;