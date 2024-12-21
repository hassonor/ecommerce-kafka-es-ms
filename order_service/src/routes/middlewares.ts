import {NextFunction, Request, Response} from 'express';
import {ValidateUser} from '../utils';

export const RequestAuthorizer = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            res.status(403).json({error: 'Unauthorized due to authorization token missing!'});
            return; // return void
        }

        const userData = await ValidateUser(token);
        req.user = userData;

        next();
    } catch (error) {
        res.status(403).json({error});
    }
};

export const UserGuard = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        if (!req.user) {
            res.status(401).json({error: 'User not found'});
            return;
        }
        next();
    } catch (error) {
        res.status(401).json({error});
    }
};
