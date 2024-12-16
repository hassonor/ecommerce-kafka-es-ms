import {IsNotEmpty, IsNumber, IsOptional, IsString, Min} from "class-validator";

export class CreateProductRequest {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @Min(1)
    price: number;

    @IsNumber()
    stock: number;
}

export class UpdateProductRequest {

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    price?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    stock?: number;
}