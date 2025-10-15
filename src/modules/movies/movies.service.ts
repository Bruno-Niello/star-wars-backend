import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Movie } from "./entities/movie.entity";
import { Repository } from "typeorm";
import { isUUID } from "class-validator";

@Injectable()
export class MoviesService {
  private readonly logger = new Logger("MoviesService");

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>
  ) {}

  async create(createMovieDto: CreateMovieDto) {
    try {
      const { title } = createMovieDto;
      const titleExist = await this.findOne(title);
      if (titleExist) {
        throw new BadRequestException(`Movie with title ${title} already exists`);
      }

      const movie = this.movieRepository.create(createMovieDto);
      await this.movieRepository.save(movie);
      this.logger.log(`Movie created: ${movie.title}`);
      return movie;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  findAll() {
    try {
      return this.movieRepository.find();
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOne(term: string) {
    try {
      if (!term || typeof term !== "string") {
        throw new BadRequestException("Invalid ID/Title format or missing.");
      }

      let movie: Movie | null;

      if (isUUID(term)) {
        movie = await this.movieRepository.findOneBy({ id: term });
      } else {
        movie = await this.movieRepository.findOneBy({ title: term });
      }

      if (!movie) {
        this.logger.warn(`Movie with ${term} not found`);
        throw new NotFoundException(`Movie with ${term} not found`);
      }

      this.logger.log(`Movie found: ${movie.title}`);
      return movie;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async update(updateMovieDto: UpdateMovieDto) {
    try {
      const { id, ...body } = updateMovieDto;
      const movie = await this.findOne(id);

      await this.movieRepository.update(id, body);
      this.logger.log(`Movie updated: ${id}`);
      return movie;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      const movie = await this.findOne(id);
      if (!movie) {
        throw new NotFoundException(`Movie with ID ${id} not found cannot delete`);
      }

      await this.movieRepository.remove(movie);
      this.logger.log(`Movie removed: ${movie.title}`);

      return { message: `Movie with ID ${id} removed successfully` };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  private handleExceptions(error: unknown) {
    this.logger.error(error);

    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }

    // Handle unique constraint violation (e.g., duplicate title) from postgres
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      throw new BadRequestException((error as { detail?: string }).detail);
    }

    // Unexpected errors
    throw new InternalServerErrorException(
      `Unexpected error, for more detail check server logs -> ${
        typeof error === "object" && error !== null && "detail" in error
          ? (error as { detail?: string }).detail
          : String(error)
      }`
    );
  }
}
