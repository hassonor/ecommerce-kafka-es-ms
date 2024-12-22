// handler.test.ts

import {Request, Response, NextFunction} from 'express';
import {HandleErrorWithLogger, HandleUnCaughtException} from '../handler';
import {
    NotFoundError,
    ValidationError,
    AuthorizeError,
} from '../errors';
import {logger} from '../../logger';

jest.mock('../../logger', () => ({
    logger: {
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

const mockExit = jest
    .spyOn(process, 'exit')
    .mockImplementation((code?: string | number | null | undefined): never => {
        throw new Error(`process.exit was called with code: ${code}`);
    });

describe('HandleErrorWithLogger', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it('should handle a generic error and log as error', () => {
        const error = new Error('Something bad happened');

        HandleErrorWithLogger(
            error,
            mockReq as Request,
            mockRes as Response,
            mockNext
        );

        expect(logger.error).toHaveBeenCalledWith(error);
        expect(logger.warn).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({error: error.message});
    });

    it('should handle a NotFoundError and log as warn', () => {
        const notFoundError = new NotFoundError('Resource not found');
        (notFoundError as any).status = 404;

        HandleErrorWithLogger(
            notFoundError,
            mockReq as Request,
            mockRes as Response,
            mockNext
        );

        expect(logger.warn).toHaveBeenCalledWith(notFoundError);
        expect(logger.error).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Resource not found',
        });
    });

    it('should handle a ValidationError and log as warn', () => {
        const validationError = new ValidationError('Invalid input');
        (validationError as any).status = 400;

        HandleErrorWithLogger(
            validationError,
            mockReq as Request,
            mockRes as Response,
            mockNext
        );

        expect(logger.warn).toHaveBeenCalledWith(validationError);
        expect(logger.error).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Invalid input',
        });
    });

    it('should handle an AuthorizeError and log as warn', () => {
        const authorizeError = new AuthorizeError('Forbidden');
        (authorizeError as any).status = 403;

        HandleErrorWithLogger(
            authorizeError,
            mockReq as Request,
            mockRes as Response,
            mockNext
        );

        expect(logger.warn).toHaveBeenCalledWith(authorizeError);
        expect(logger.error).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Forbidden',
        });
    });
});

describe('HandleUnCaughtException', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should log the error and call process.exit(1)', async () => {
        const testError = new Error('Uncaught!');
        try {
            await HandleUnCaughtException(testError);
        } catch (e) {
            expect((e as Error).message).toContain('process.exit was called with code: 1');
        }

        expect(logger.error).toHaveBeenCalledWith(testError);
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});
