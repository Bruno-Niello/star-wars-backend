import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsEnum, IsOptional } from "class-validator";

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({ enum: ["admin", "user"], default: "user", required: false })
  @IsOptional()
  @IsEnum(["admin", "user"])
  role?: "admin" | "user";
}
