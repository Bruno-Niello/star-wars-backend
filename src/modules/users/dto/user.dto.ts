import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsEmail, IsEnum } from "class-validator";

export class UserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: ["admin", "user"] })
  @IsEnum(["admin", "user"])
  role: "admin" | "user";
}
