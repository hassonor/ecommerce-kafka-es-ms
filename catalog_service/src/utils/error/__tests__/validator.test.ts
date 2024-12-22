import {plainToClass} from "class-transformer";
import {IsNotEmpty, IsString} from "class-validator";
import {ValidateError} from "../validator";


/**
 * Example class to test with class-validator
 */
class TestInput {
    @IsNotEmpty({message: "Name should not be empty"})
    @IsString({message: "Name must be a string"})
    name!: string;

    @IsNotEmpty({message: "Email should not be empty"})
    @IsString({message: "Email must be a string"})
    email!: string;
}

describe("ValidateError", () => {
    it("should return false when input is valid", async () => {
        // Arrange: create a valid object
        const validObject = plainToClass(TestInput, {
            name: "John Doe",
            email: "john@example.com",
        });

        // Act: pass the object to ValidateError
        const result = await ValidateError(validObject);

        // Assert: no validation errors -> returns false
        expect(result).toBe(false);
    });

    it("should return array of errors when input is invalid", async () => {
        // Arrange: create an invalid object (empty name, not providing email at all)
        const invalidObject = plainToClass(TestInput, {
            name: "",
        });

        // Act
        const result = await ValidateError(invalidObject);

        // Assert
        expect(Array.isArray(result)).toBe(true);
        // We expect two errors: one for 'name' and one for 'email'
        // But if name is empty -> constraints for name
        // and if email is missing -> constraints for email
        // Let's check the shape of the error:
        if (Array.isArray(result)) {
            // We can check the first error
            const fields = result.map((err) => err.field);
            expect(fields).toContain("name");
            expect(fields).toContain("email");

            // We can also check the error messages, though your function
            // picks the first constraint message. Here, we expect something
            // like "Name should not be empty" or "Email should not be empty"
            const messages = result.map((err) => err.message);
            expect(messages.some((m) => m.includes("not be empty"))).toBe(true);
        }
    });

    it("should use 'an unknown value was passed to the validate function' if no constraints are present", async () => {

        const weirdObject = {} as TestInput;

        // Act
        const result = await ValidateError(weirdObject);

        // Assert
        if (Array.isArray(result)) {
            result.forEach((err) => {
                expect(err.message).toBe("an unknown value was passed to the validate function");
            });
        }
    });
});
