import Ajv, {Schema} from "ajv";
import {Request} from "express";

const ajv = new Ajv();

export const ValidateRequest = <T>(requestBody: unknown, schema: Schema) => {
    const validatedData = ajv.compile<T>(schema);

    if (validatedData(requestBody)) {
        return false
    }

    const errors = validatedData.errors?.map((err) => err.message);

    return errors && errors[0];
}

export function getUserOrFail(req: Request) {
    const user = req.user;
    if (!user) {
        throw new Error("User not found");
    }
    return user;
}