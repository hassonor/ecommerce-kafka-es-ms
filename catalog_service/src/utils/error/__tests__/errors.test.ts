import {
    APIError,
    ValidationError,
    AuthorizeError,
    NotFoundError,
} from "../errors";
import {STATUS_CODES} from "../status-codes";

describe("APIError", () => {
    it("should create an instance of APIError with the correct properties", () => {
        const description = "test API error";
        const error = new APIError(description);

        expect(error).toBeInstanceOf(APIError);
        expect(error.name).toBe("api internal server error");
        expect(error.status).toBe(STATUS_CODES.INTERNAL_ERROR);
        expect(error.message).toBe(description);
        expect(error.stack).toBeDefined();
    });

    it("should use default description if not provided", () => {
        const error = new APIError();
        expect(error.message).toBe("api error");
    });
});

describe("ValidationError", () => {
    it("should create an instance of ValidationError with the correct properties", () => {
        const description = "test validation error";
        const error = new ValidationError(description);

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.name).toBe("bad request");
        expect(error.status).toBe(STATUS_CODES.BAD_REQUEST);
        expect(error.message).toBe(description);
        expect(error.stack).toBeDefined();
    });

    it("should use default description if not provided", () => {
        const error = new ValidationError();
        expect(error.message).toBe("bad request");
    });
});

describe("AuthorizeError", () => {
    it("should create an instance of AuthorizeError with the correct properties", () => {
        const description = "test authorize error";
        const error = new AuthorizeError(description);

        expect(error).toBeInstanceOf(AuthorizeError);
        expect(error.name).toBe("access denied");
        expect(error.status).toBe(STATUS_CODES.UN_AUTHORISED);
        expect(error.message).toBe(description);
        expect(error.stack).toBeDefined();
    });

    it("should use default description if not provided", () => {
        const error = new AuthorizeError();
        expect(error.message).toBe("access denied");
    });
});

describe("NotFoundError", () => {
    it("should create an instance of NotFoundError with the correct properties", () => {
        const description = "test not found error";
        const error = new NotFoundError(description);

        expect(error).toBeInstanceOf(NotFoundError);
        // Notice for NotFoundError, we pass `description` as both the `name` and `message`
        expect(error.name).toBe(description);
        expect(error.status).toBe(STATUS_CODES.NOT_FOUND);
        expect(error.message).toBe(description);
        expect(error.stack).toBeDefined();
    });

    it("should use default description if not provided", () => {
        const error = new NotFoundError();
        expect(error.message).toBe("not found");
        expect(error.name).toBe("not found");
    });
});
