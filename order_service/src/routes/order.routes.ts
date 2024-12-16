import express, {Request, Response, NextFunction} from 'express';

const router = express.Router();

router.post("/order", async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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