import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min, Max, IsString, IsIn } from "class-validator";

export class PaginationDto {
  @ApiProperty({
    description: "Page number (1-based)",
    example: 1,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: "Number of items per page",
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: "Field to sort by",
    example: "title",
    default: "title",
    required: false,
  })
  @IsOptional()
  @IsString()
  orderBy?: string = "title";

  @ApiProperty({
    description: "Sort direction",
    example: "ASC",
    default: "ASC",
    enum: ["ASC", "DESC"],
    required: false,
  })
  @IsOptional()
  @IsIn(["ASC", "DESC"])
  orderDir?: "ASC" | "DESC" = "ASC";
}
