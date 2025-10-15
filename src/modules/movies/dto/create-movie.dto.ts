import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
  swapi_url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  opening_crawl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  producer?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  episode_id?: number;
}
