import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MoviesModule } from "./modules/movies/movies.module";
import { UsersModule } from "./modules/users/users.module";
import { UsersController } from "./modules/users/users.controller";
import { MoviesController } from "./modules/movies/movies.controller";
import { MoviesService } from "./modules/movies/movies.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./modules/users/users.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
    }),
    MoviesModule,
    UsersModule,
  ],
  controllers: [UsersController, MoviesController],
  providers: [MoviesService, UsersService],
  exports: [],
})
export class AppModule {}
