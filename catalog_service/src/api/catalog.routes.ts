import express, {Request, Response, NextFunction} from 'express';


const router = express.Router();


// endpoints
router.post(
    "/product",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.status(201).json({
                message: "Product created successfully",
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;