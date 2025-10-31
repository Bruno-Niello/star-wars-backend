import { ApiProperty } from "@nestjs/swagger";
import { Movie } from "../entities/movie.entity";

export class MovieResponseDto {
  @ApiProperty({
    description: "The unique identifier of the movie",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  id: string;

  @ApiProperty({
    description: "The title of the movie",
    example: "A New Hope",
  })
  title: string;

  @ApiProperty({
    description: "The episode number of the movie",
    example: 4,
  })
  episode_id: number;

  @ApiProperty({
    description: "The opening crawl text of the movie",
    example: "It is a period of civil war. Rebel spaceships, striking from a hidden base...",
  })
  opening_crawl: string;

  @ApiProperty({
    description: "The director of the movie",
    example: "George Lucas",
  })
  director: string;

  @ApiProperty({
    description: "The producer(s) of the movie",
    example: "Gary Kurtz, Rick McCallum",
  })
  producer: string;

  @ApiProperty({
    description: "The release date of the movie",
    example: "1977-05-25",
  })
  release_date: string;

  @ApiProperty({
    description: "The SWAPI URL of the movie",
    example: "https://swapi.dev/api/films/1/",
    required: false,
  })
  swapi_url?: string;

  @ApiProperty({
    description: "The creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  created_at: Date;

  @ApiProperty({
    description: "The last update timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  updated_at: Date;

  constructor(movie: Movie) {
    this.id = movie.id;
    this.title = movie.title;
    this.episode_id = movie.episode_id;
    this.opening_crawl = movie.opening_crawl;
    this.director = movie.director;
    this.producer = movie.producer;
    this.release_date = movie.release_date;
    this.swapi_url = movie.swapi_url;
    this.created_at = movie.created_at;
    this.updated_at = movie.updated_at;
  }
}

export class SwapiSyncResponseDto {
  @ApiProperty({
    description: "Number of movies synchronized from SWAPI",
    example: 6,
  })
  count: number;

  @ApiProperty({
    description: "Success message",
    example: "Successfully synchronized 6 movies from SWAPI",
  })
  message: string;
}

export class DeleteMovieResponseDto {
  @ApiProperty({
    description: "Success message",
    example: "Movie deleted successfully",
  })
  message: string;

  @ApiProperty({
    description: "ID of the deleted movie",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  deletedId: string;
}
