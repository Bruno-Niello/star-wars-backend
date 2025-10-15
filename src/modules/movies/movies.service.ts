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
import axios, { AxiosResponse } from "axios";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class MoviesService {
  private readonly logger = new Logger("MoviesService");

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>
  ) {}

  async create(createMovieDto: CreateMovieDto, suppressErrors = false) {
    try {
      const { title } = createMovieDto;
      const titleExist = await this.movieRepository.findOneBy({ title });
      if (titleExist) {
        throw new BadRequestException(`Movie with title ${title} already exists`);
      }

      const movie = this.movieRepository.create(createMovieDto);
      await this.movieRepository.save(movie);
      this.logger.log(`Movie created: ${movie.title}`);
      return movie;
    } catch (error) {
      if (suppressErrors && error instanceof BadRequestException) {
        this.logger.warn(error.message);
        return null;
      }
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

  async update(id: string, updateMovieDto: UpdateMovieDto) {
    try {
      await this.findOne(id);
      await this.movieRepository.update(id, updateMovieDto);
      this.logger.log(`Movie updated: ${id}`);
      return await this.findOne(id);
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

  async syncWithSwapi() {
    const response: { title: string; status: string; reason?: string }[] = [];
    this.logger.log("Sync local DB with SWAPI...");
    const movies = await this.fetchAllFilms();

    if (!movies || movies.length === 0) {
      this.logger.warn("No movies found from SWAPI to sync or there was an error fetching data.");
      return { count: 0 };
    }

    this.logger.log(`Fetched ${movies.length} movies from SWAPI. Starting sync...`);
    for (const movie of movies) {
      const movieData: CreateMovieDto = {
        title: movie.title,
        director: movie.director,
        release_date: movie.release_date,
        swapi_url: movie.url,
        opening_crawl: movie.opening_crawl,
        producer: movie.producer,
        episode_id: movie.episode_id,
      };

      const created = await this.create(movieData, true);
      if (created) {
        response.push({ title: movie.title, status: "created" });
      } else {
        response.push({ title: movie.title, status: "skipped", reason: "already exists" });
      }
    }

    return { count: response.length, results: response };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleSwapiSyncCron() {
    this.logger.log("Running scheduled SWAPI sync...");
    await this.syncWithSwapi();
  }

  private async fetchAllFilms(): Promise<SwapiFilmProperties[]> {
    const url = "https://www.swapi.tech/api/films";
    const response: AxiosResponse<{ result: SwapiFilmResult[] }> = await axios.get(url);
    return response.data.result.map(film => film.properties);
  }

  private handleExceptions(error: unknown) {
    this.logger.error(error);

    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      throw new BadRequestException((error as { detail?: string }).detail);
    }

    throw new InternalServerErrorException(
      `Unexpected error, for more detail check server logs -> ${
        typeof error === "object" && error !== null && "detail" in error
          ? (error as { detail?: string }).detail
          : String(error)
      }`
    );
  }
}

interface SwapiFilmProperties {
  title: string;
  director: string;
  release_date: string;
  url: string;
  opening_crawl?: string;
  producer?: string;
  episode_id?: number;
}

interface SwapiFilmResult {
  properties: SwapiFilmProperties;
}
