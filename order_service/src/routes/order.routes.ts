import express, {NextFunction, Request, Response} from 'express';
import {MessageBroker} from "../utils";
import {OrderEvent} from "../types";

const router = express.Router();

router.post("/order", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // order create logic

    // 3rd step: publish the message
    await MessageBroker.publish({
        topic: "OrderEvents",
        headers: {token: req.headers.authorization},
        event: OrderEvent.CREATE_ORDER,
        message: {
            orderId: 1,
            items: [{
                productId: 1,
                quantity: 1,
            },
                {
                    productId: 2,
                    quantity: 2
                }]
        }
    })
    return res.status(200).json({message: "create order"})
})

router.get("/order", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    return res.status(200).json({message: "get order"})
})

router.get("/order/:id", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    return res.status(200).json({message: "get order by id"})
})


router.delete("/order/:id", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    return res.status(200).json({message: "delete order by id"})
})

export default router;