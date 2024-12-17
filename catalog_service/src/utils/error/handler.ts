import {Request, Response, NextFunction, ErrorRequestHandler} from 'express';
import {
    AuthorizeError,
    NotFoundError,
    ValidationError,
} from './errors';
import {logger} from '../logger';


export const HandleErrorWithLogger: ErrorRequestHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let reportError = true;
    let status = 500;
    let data = error.message;

    [NotFoundError, ValidationError, AuthorizeError].forEach((typeOfError) => {
        if (error instanceof typeOfError) {
            reportError = false;
            // Safely handle status if error classes have a status property
            status = (error as any).status ?? 400;
            data = error.message;
        }
    });

    if (reportError) {
        logger.error(error);
    } else {
        logger.warn(error);
    }

    // Do NOT return the response, just send it
    res.status(status).json({error: data});
};

export const HandleUnCaughtException = async (
    error: Error,
) => {
    // error report / monitoring tools
    logger.error(error);
    // recover
    process.exit(1);
};