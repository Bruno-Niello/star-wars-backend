import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MoviesModule } from "./modules/movies/movies.module";
import { UsersModule } from "./modules/users/users.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("database.host"),
        port: configService.get<number>("database.port"),
        database: configService.get<string>("database.name"),
        username: configService.get<string>("database.username"),
        password: configService.get<string>("database.password"),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => {
        const secret: string = configService.get<string>("jwt.secret") || "fallbackSecret123";
        return {
          secret,
          signOptions: { expiresIn: "1d" },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    MoviesModule,
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  exports: [],
})
export class AppModule {}
