import {validate, ValidationError} from "class-validator";
import {ClassConstructor, plainToInstance} from "class-transformer";

const validationError = async (input: any): Promise<ValidationError[] | false> => {
    const error = await validate(input, {validationError: {target: true}});

    if (error.length > 0) {
        return error;
    }

    return false;
};

export const RequestValidator = async <T>(
    type: ClassConstructor<T>,
    body: any
): Promise<{ errors: boolean | string; input: T }> => {
    const input = plainToInstance(type, body);

    const errors = await validationError(input);
    if (errors) {
        const errorMessage = errors
            .map((error: ValidationError) => Object.values(error.constraints ?? {}))
            .flat()
            .join(", ");

        return {errors: errorMessage, input};
    }

    return {
        errors: false,
        input
    };
};