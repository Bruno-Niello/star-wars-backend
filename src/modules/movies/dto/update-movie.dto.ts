import { PartialType } from "@nestjs/mapped-types";
import { CreateMovieDto } from "./create-movie.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  @ApiProperty()
  @IsString()
  id: string;
}
