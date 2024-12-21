import express, {Request, Response, NextFunction} from 'express';
import * as service from '../service/cart.service';
import * as repository from '../repository/cart.repository';
import {CartRequestInput, CartRequestSchema} from '../dto/cartRequest.dto';
import {ValidateRequest} from '../utils';
import {RequestAuthorizer, UserGuard} from './middlewares';

const router = express.Router();
const repo = repository.CartRepository;

router.post(
    '/cart',
    RequestAuthorizer,
    UserGuard,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const error = ValidateRequest<CartRequestInput>(
                req.body as CartRequestInput,
                CartRequestSchema
            );
            if (error) {
                res.status(400).json({error});
                return;
            }

            const input: CartRequestInput = req.body;

            const response = await service.CreateCart(
                {
                    ...input,
                    customerId: req.user?.id!,
                },
                repo
            );

            res.status(200).json(response);
            return;
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/cart',
    RequestAuthorizer,
    UserGuard,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const response = await service.GetCart(req.user?.id!, repo);
            res.status(200).json(response);
            return;
        } catch (error) {
            next(error);
        }
    }
);

router.patch(
    '/cart/:lineItemId',
    RequestAuthorizer,
    UserGuard,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const liteItemId = req.params.lineItemId;
            const response = await service.EditCart(
                {
                    id: +liteItemId,
                    qty: req.body.qty,
                    customerId: req.user?.id!,
                },
                repo
            );
            res.status(200).json(response);
            return;
        } catch (error) {
            next(error);
        }
    }
);

router.delete(
    '/cart/:lineItemId',
    RequestAuthorizer,
    UserGuard,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const lineItemId = req.params.lineItemId;
            const response = await service.DeleteCart({customerId: req.user?.id!, id: +lineItemId}, repo);
            res.status(200).json(response);
            return;
        } catch (error) {
            next(error);
        }
    }
);

export default router;
