import express, {NextFunction, Request, Response} from 'express';
import * as service from "../service/order.service";
import {RequestAuthorizer, UserGuard} from "./middlewares";
import {OrderRepository} from "../repository/order.repository";
import {CartRepository} from "../repository/cart.repository";

const orderRepo = OrderRepository;
const cartRepo = CartRepository;
const router = express.Router();

router.post("/orders", RequestAuthorizer, UserGuard, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const response = await service.CreateOrder(req.user?.id!, orderRepo, cartRepo);
        return res.status(201).json(response);
    } catch (error) {
        next(error);
    }
})

router.get("/orders", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({error: 'User not found'});
        }
        const response = await service.GetOrders(user.id, orderRepo);
        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
})

router.get("/orders/:id", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const orderId = parseInt(req.params.id);
        const response = await service.GetOrder(orderId, orderRepo);
        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
})

// Only going to call from microservice
router.patch("/orders/:id", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        // security check for microservice calls only
        const orderId = parseInt(req.params.id);
        const status = req.body.status;
        const response = await service.UpdateOrder(orderId, status, orderRepo);
        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
})


// Only going to call from microservice
router.delete("/orders/:id", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({error: 'User not found'});
        }
        const orderId = parseInt(req.params.id);
        const response = await service.DeleteOrder(orderId, orderRepo);
        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
})

export default router;