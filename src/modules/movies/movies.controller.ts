import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import { MoviesService } from "./movies.service";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Movie } from "./entities/movie.entity";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("movies")
@Controller("movies")
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiResponse({ status: 403, description: "Forbidden. Only admins can create movies." })
  @ApiResponse({ status: 201, description: "The movie has been successfully created." })
  @ApiResponse({ status: 400, description: "Bad Request. Invalid input data." })
  @ApiOperation({ summary: "Create a new movie" })
  create(@Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(createMovieDto);
  }

  @Get()
  @ApiResponse({ status: 200, description: "List of movies retrieved successfully." })
  @ApiOperation({ summary: "Retrieve a list of all movies" })
  findAll(@Query("orderBy") orderBy?: keyof Movie, @Query("orderDir") orderDir?: "ASC" | "DESC") {
    return this.moviesService.findAll(orderBy, orderDir);
  }

  @Get(":id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("USER", "ADMIN")
  @ApiResponse({
    status: 403,
    description: "Forbidden. Only authenticated users can access a specific movie.",
  })
  @ApiResponse({ status: 404, description: "Movie not found." })
  @ApiResponse({ status: 200, description: "Movie retrieved successfully." })
  @ApiOperation({ summary: "Retrieve a movie by its ID" })
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.moviesService.findOne(id);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiResponse({ status: 403, description: "Forbidden. Only admins can update movies." })
  @ApiOperation({ summary: "Update a movie by its ID" })
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() updateMovieDto: UpdateMovieDto) {
    return this.moviesService.update(id, updateMovieDto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiResponse({ status: 403, description: "Forbidden. Only admins can delete movies." })
  @ApiOperation({ summary: "Delete a movie by its ID" })
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.moviesService.remove(id);
  }

  @Get("sync/swapi")
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiResponse({ status: 403, description: "Forbidden. Only admins can sync with SWAPI." })
  @ApiResponse({ status: 200, description: "SWAPI data synchronized successfully." })
  @ApiOperation({ summary: "Sync local DB with SWAPI" })
  syncWithSwapi() {
    return this.moviesService.syncWithSwapi();
  }
}
