import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MoviesService } from "./movies.service";
import { MoviesController } from "./movies.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Movie } from "./entities/movie.entity";

@Module({
  controllers: [MoviesController],
  providers: [MoviesService],
  imports: [TypeOrmModule.forFeature([Movie]), JwtModule],
})
export class MoviesModule {}
