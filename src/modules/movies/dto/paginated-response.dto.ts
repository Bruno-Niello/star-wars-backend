import { ApiProperty } from "@nestjs/swagger";
import { MovieResponseDto } from "./movie-response.dto";

export class PaginationMetaDto {
  @ApiProperty({
    description: "Current page number",
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: "Number of items per page",
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: "Total number of items",
    example: 42,
  })
  totalItems: number;

  @ApiProperty({
    description: "Total number of pages",
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: "Indicates if there are more pages",
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: "Indicates if there are previous pages",
    example: false,
  })
  hasPrevious: boolean;

  constructor(page: number, limit: number, totalItems: number) {
    this.page = page;
    this.limit = limit;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrevious = page > 1;
  }
}

export class PaginatedMoviesResponseDto {
  @ApiProperty({
    description: "List of movies",
    type: [MovieResponseDto],
  })
  data: MovieResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  constructor(movies: MovieResponseDto[], meta: PaginationMetaDto) {
    this.data = movies;
    this.meta = meta;
  }
}
