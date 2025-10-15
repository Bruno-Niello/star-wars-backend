import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { User } from "../users/entities/user.entity";

@Injectable()
export class AuthService {
  private readonly logger = new Logger("AuthService");

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    try {
      const user: User | undefined = await this.usersService.findOneWithPassword(email);
      if (!user) return null;

      const comparedPassword = await bcrypt.compare(password, user.password);
      if (comparedPassword) {
        // Exclude password from the returned user object
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, ...safeUser } = user;
        return safeUser;
      }

      return null;
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      this.logger.error(error);
      return null;
    }
  }

  async signUp(user: CreateUserDto) {
    let userExists: User | null | undefined;
    try {
      userExists = await this.usersService.findOneWithPassword(user.email);
    } catch (e) {
      if (e instanceof NotFoundException) {
        userExists = null;
      } else {
        this.logger.error(e);
        throw e;
      }
    }

    if (userExists) throw new ConflictException(`User already exists`);

    try {
      user.password = await bcrypt.hash(user.password, 10);

      const createdUser = await this.usersService.create(user);
      if (!createdUser) throw new UnauthorizedException();

      return {
        ...createdUser,
        accessToken: await this.jwtService.signAsync(createdUser),
        refreshToken: await this.jwtService.signAsync(createdUser, {
          expiresIn: "1d",
        }),
      };
    } catch (e) {
      this.logger.error(e);
      throw new UnauthorizedException();
    }
  }

  async signIn(email: string, pwd: string) {
    const validatedUser = await this.validateUser(email, pwd);

    if (!validatedUser || validatedUser instanceof NotFoundException) {
      throw new UnauthorizedException();
    }

    try {
      return {
        ...validatedUser,
        accessToken: await this.jwtService.signAsync(validatedUser),
        refreshToken: await this.jwtService.signAsync(validatedUser, {
          expiresIn: "1d",
        }),
      };
    } catch (e) {
      this.logger.error(e);
      throw new UnauthorizedException();
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const { refreshToken } = refreshTokenDto;

      const decodedToken: User = await this.jwtService.verifyAsync(refreshToken);

      const user = await this.usersService.findOneWithPassword(decodedToken.email);

      if (!user) throw new UnauthorizedException("Invalid or expired refresh token");

      // Exclude password from the returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...safeUser } = user;

      return {
        accessToken: await this.jwtService.signAsync(safeUser),
        refreshToken: await this.jwtService.signAsync(safeUser, {
          expiresIn: "1d",
        }),
      };
    } catch (e) {
      this.logger.error(e);
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
}
