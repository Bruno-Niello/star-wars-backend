import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class CreateAdminDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}
