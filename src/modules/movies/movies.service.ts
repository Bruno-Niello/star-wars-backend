import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
    private readonly movieRepository: Repository<Movie>,
    private readonly configService: ConfigService
  ) {}

  /**
   * Create a new movie
   * @param createMovieDto - Data transfer object for creating a movie
   * @param suppressErrors - Flag to suppress errors
   * @returns The created movie or null if suppressed
   * @throws BadRequestException if the movie already exists
   */
  async create(
    createMovieDto: CreateMovieDto,
    suppressErrors = false
  ): Promise<Movie | null | undefined> {
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

  /**
   * Get paginated list of movies with sorting
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @param orderBy - Field to order by (default: title)
   * @param orderDir - Order direction (ASC or DESC, default: ASC)
   * @returns Paginated list of movies with metadata
   * @throws BadRequestException if the request is invalid
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: keyof Movie = "title",
    orderDir: "ASC" | "DESC" = "ASC"
  ): Promise<{ movies: Movie[]; totalItems: number } | undefined> {
    try {
      const skip = (page - 1) * limit;

      const [movies, totalItems] = await this.movieRepository.findAndCount({
        order: { [orderBy]: orderDir },
        skip,
        take: limit,
      });

      return { movies, totalItems };
    } catch (error) {
      this.handleExceptions(error);
      return undefined;
    }
  }

  /**
   * Find by ID (UUID) or Title (string)
   * Example: findOne('550e8400-e29b-41d4-a716-446655440000') or findOne('A New Hope')
   * @param term - ID or Title of the movie
   * @returns The found movie or undefined if not found
   * @throws BadRequestException if the term is invalid
   * @throws NotFoundException if the movie is not found
   */
  async findOne(term: string): Promise<Movie | undefined> {
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

  /**
   * Update a movie by ID
   * @param id - Movie ID (UUID)
   * @param updateMovieDto
   * @returns The updated movie or undefined if error occurs
   * @throws BadRequestException if the request is invalid
   * @throws NotFoundException if the movie is not found
   */
  async update(id: string, updateMovieDto: UpdateMovieDto): Promise<Movie | undefined> {
    try {
      await this.findOne(id);
      await this.movieRepository.update(id, updateMovieDto);
      this.logger.log(`Movie updated: ${id}`);
      return await this.findOne(id);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * Remove a movie by ID
   * @param id - Movie ID (UUID)
   * @returns A message indicating the result of the removal or undefined if error occurs
   * @throws NotFoundException if the movie is not found
   */
  async remove(id: string): Promise<{ message: string } | undefined> {
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

  /**
   * Sync local database with SWAPI films
   * This method fetches all films from SWAPI and adds them to the local database if they don't already exist
   * It logs the process and handles errors gracefully
   * @returns An object containing the count of synced movies and an array of results
   * Each result contains the title, status (created/skipped), and reason if skipped
   * @throws InternalServerErrorException if an unexpected error occurs during the sync process
   */
  async syncWithSwapi(): Promise<{
    count: number;
    results: { title: string; status: string; reason?: string }[];
  }> {
    const response: { title: string; status: string; reason?: string }[] = [];
    this.logger.log("Sync local DB with SWAPI...");
    const movies = await this.fetchAllFilms();

    if (!movies || movies.length === 0) {
      this.logger.warn("No movies found from SWAPI to sync or there was an error fetching data.");
      return { count: 0, results: [] };
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

  /**
   * You can replace the cron expression with @Cron(CronExpression.EVERY_MINUTE) for testing purposes
   * By default this will run the sync every day at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleSwapiSyncCron() {
    this.logger.log("Running scheduled SWAPI sync...");
    await this.syncWithSwapi();
  }

  /**
   * Fetch all films from SWAPI
   * @returns An array of film properties fetched from SWAPI
   */
  private async fetchAllFilms(): Promise<SwapiFilmProperties[]> {
    const baseUrl = this.configService.get<string>("swapi.baseUrl");
    const filmsEndpoint = this.configService.get<string>("swapi.filmsEndpoint");
    const url = `${baseUrl}${filmsEndpoint}`;

    this.logger.log(`Fetching films from SWAPI: ${url}`);
    const response: AxiosResponse<{ result: SwapiFilmResult[] }> = await axios.get(url);
    return response.data.result.map(film => film.properties);
  }

  /**
   * This method handles exceptions and throws appropriate HTTP exceptions
   * It logs the error and checks for specific error types to throw
   * If the error is not recognized, it throws a generic InternalServerErrorException
   * @param error - The error to handle
   */
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
