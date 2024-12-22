/**
 * middlewares.test.ts
 */
import {Request, Response, NextFunction} from 'express';
import {RequestAuthorizer, UserGuard} from './middlewares';
// ^ Adjust the path to your actual middlewares file
import {ValidateUser} from '../utils';
// ^ Adjust path if needed

// Mock the ValidateUser function from "../utils"
jest.mock('../utils', () => ({
    ValidateUser: jest.fn(),
}));

describe('Middlewares Tests', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        // Reinitialize for each test
        req = {
            headers: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    /*********************************************************************
     * TESTS FOR RequestAuthorizer
     *********************************************************************/
    describe('RequestAuthorizer', () => {
        it('should return 403 if no authorization header is provided', async () => {
            // No req.headers.authorization
            await RequestAuthorizer(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Unauthorized due to authorization token missing!',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should set req.user and call next if token is valid', async () => {
            const mockToken = 'Bearer valid-token';
            req.headers = {authorization: mockToken};

            // Mock ValidateUser to resolve a user object
            const mockUser = {id: 123, name: 'Alice'};
            (ValidateUser as jest.Mock).mockResolvedValue(mockUser);

            await RequestAuthorizer(req as Request, res as Response, next);

            expect(ValidateUser).toHaveBeenCalledWith(mockToken);
            expect(req.user).toEqual(mockUser);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });

        it('should return 403 if ValidateUser throws an error', async () => {
            const mockToken = 'Bearer invalid-token';
            req.headers = {authorization: mockToken};

            (ValidateUser as jest.Mock).mockRejectedValue(new Error('Token error'));

            await RequestAuthorizer(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({error: new Error('Token error')});
            expect(next).not.toHaveBeenCalled();
        });
    });

    /*********************************************************************
     * TESTS FOR UserGuard
     *********************************************************************/
    describe('UserGuard', () => {
        it('should return 401 if req.user is not defined', () => {
            // By default, req.user is undefined in our mock
            UserGuard(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({error: 'User not found'});
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next if req.user is defined', () => {
            req.user = {
                id: 789, email: 'test123@test.com', iat: 1734758569,
                exp: 1734844969
            };

            UserGuard(req as Request, res as Response, next);

            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });
});
