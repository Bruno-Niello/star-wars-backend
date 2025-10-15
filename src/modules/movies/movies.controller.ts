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
} from "@nestjs/common";
import { MoviesService } from "./movies.service";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("movies")
@Controller("movies")
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  // esto deberia ser solo para admin
  @Post()
  @ApiOperation({ summary: "Create a new movie" })
  @ApiResponse({ status: 201, description: "The movie has been successfully created." })
  @ApiResponse({ status: 400, description: "Bad Request. Invalid input data." })
  create(@Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(createMovieDto);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve a list of all movies" })
  @ApiResponse({ status: 200, description: "List of movies retrieved successfully." })
  findAll() {
    return this.moviesService.findAll();
  }

  // esto deberia ser solo para users y no admins
  @Get(":id")
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.moviesService.findOne(id);
  }

  // esto deberia ser solo para admins
  @Patch(":id")
  @UseGuards()
  // @Roles("admin")
  @ApiResponse({ status: 403, description: "Forbidden. Only admins can update movies." })
  @ApiOperation({ summary: "Update a movie by its ID" })
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() updateMovieDto: UpdateMovieDto) {
    return this.moviesService.update(id, updateMovieDto);
  }

  // esto deberia ser solo para admins
  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.moviesService.remove(id);
  }

  @Get("sync/swapi")
  @ApiOperation({ summary: "Sync local DB with SWAPI" })
  @ApiResponse({ status: 200, description: "SWAPI data synchronized successfully." })
  syncWithSwapi() {
    return this.moviesService.syncWithSwapi();
  }
}
