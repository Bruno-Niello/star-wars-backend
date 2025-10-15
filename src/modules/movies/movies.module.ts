import { Module } from "@nestjs/common";
import { MoviesService } from "./movies.service";
import { MoviesController } from "./movies.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Movie } from "./entities/movie.entity";

@Module({
  controllers: [MoviesController],
  providers: [MoviesService],
  imports: [TypeOrmModule.forFeature([Movie])],
})
export class MoviesModule {}
