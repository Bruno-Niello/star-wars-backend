import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMovieDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  director: string;

  @ApiProperty()
  @IsString()
  release_date: string;

  @ApiProperty()
  @IsString()
  swapi_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  opening_crawl?: string;
}
