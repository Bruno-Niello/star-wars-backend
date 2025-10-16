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

  /**
   * validateUser - Validates a user by email and password
   * @param email - The email of the user
   * @param password - The password of the user
   * @returns null if user not found or password does not match
   * @returns the user object without password if validation is successful
   * @throws logs errors and returns null if an error occurs
   */
  async validateUser(email: string, password: string) {
    try {
      this.logger.log(`validateUser - trying to find user by email: ${email}`);
      const user: User | undefined = await this.usersService.findOneWithPassword(email);
      if (!user) {
        this.logger.log(`validateUser - user not found: ${email}`);
        return null;
      }

      const comparedPassword = await bcrypt.compare(password, user.password);
      this.logger.log(`validateUser - password match for ${email}: ${comparedPassword}`);

      if (comparedPassword) {
        // Exclude password from the returned user object
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, ...safeUser } = user;
        return safeUser;
      }

      return null;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Sign up a new user
   * This method first checks if a user with the given email already exists.
   * If the user exists, it throws a ConflictException.
   * If the user does not exist, it creates a new user using the UsersService.
   * After creating the user, it generates an access token and a refresh token using JwtService.
   * If any error occurs during this process, it logs the error and throws an UnauthorizedException.
   * @param user - The user data for sign up
   * @returns The created user object with access and refresh tokens
   * @throws ConflictException if the user already exists
   * @throws UnauthorizedException if sign up fails
   */
  async signUp(user: CreateUserDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    let userExists: User | null | undefined;
    try {
      userExists = await this.usersService.findOneWithPassword(user.email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        userExists = null;
      } else {
        this.logger.error(error);
        throw error;
      }
    }

    if (userExists) throw new ConflictException(`User already exists`);

    try {
      const createdUser = await this.usersService.create(user);
      if (!createdUser) throw new UnauthorizedException();
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new UnauthorizedException("JWT secret not set");

      return {
        ...createdUser,
        accessToken: await this.jwtService.signAsync(createdUser, {
          expiresIn: "1d",
          secret: jwtSecret,
        }),
        refreshToken: await this.jwtService.signAsync(createdUser, {
          expiresIn: "1d",
          secret: jwtSecret,
        }),
      };
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException();
    }
  }

  /**
   * Sign in a user
   * @param email - The email of the user
   * @param pwd - The password of the user
   * @returns The user object with access and refresh tokens if sign in is successful
   * @throws UnauthorizedException if sign in fails
   */
  async signIn(
    email: string,
    pwd: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const validatedUser = await this.validateUser(email, pwd);

    if (!validatedUser || validatedUser instanceof NotFoundException) {
      throw new UnauthorizedException();
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new UnauthorizedException("JWT secret not set");

      return {
        ...validatedUser,
        accessToken: await this.jwtService.signAsync(validatedUser, {
          expiresIn: "1d",
          secret: jwtSecret,
        }),
        refreshToken: await this.jwtService.signAsync(validatedUser, {
          expiresIn: "1d",
          secret: jwtSecret,
        }),
      };
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException();
    }
  }

  /**
   * Refresh the access token using the refresh token
   * @param refreshTokenDto - The refresh token data transfer object
   * @returns The new access token and refresh token
   * @throws UnauthorizedException if the refresh token is invalid or expired
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const { refreshToken } = refreshTokenDto;

      const decodedToken: User = await this.jwtService.verifyAsync(refreshToken);

      const user = await this.usersService.findOneWithPassword(decodedToken.email);

      if (!user) throw new UnauthorizedException("Invalid or expired refresh token");

      // Exclude password from the returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...safeUser } = user;
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new UnauthorizedException("JWT secret not set");

      return {
        accessToken: await this.jwtService.signAsync(safeUser, {
          expiresIn: "1d",
          secret: jwtSecret,
        }),
        refreshToken: await this.jwtService.signAsync(safeUser, {
          expiresIn: "1d",
          secret: jwtSecret,
        }),
      };
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
}
