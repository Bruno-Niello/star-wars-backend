import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import bcrypt from "bcrypt";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger("UsersService");

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  /**
   * Create a user manually, its an admin function
   * @param createUserDto - Data transfer object for creating a user
   * @returns The created user or undefined if an error occurs
   * @throws BadRequestException if the user already exists
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, "password"> | undefined> {
    try {
      const { email, password, ...data } = createUserDto;

      const existingUser = await this.userRepository.findOneBy({ email });
      if (existingUser) {
        throw new BadRequestException(`User with email ${email} already exists`);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({ ...data, email, password: hashedPassword });

      await this.userRepository.save(user);
      this.logger.log(`User created: ${user.email}`);

      // Exclude password from the returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...safeUser } = user;

      return safeUser;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * Find all users
   * @returns All users without passwords or undefined if an error occurs
   * @throws BadRequestException if the request is invalid
   */
  async findAll(): Promise<Omit<User, "password">[] | undefined> {
    try {
      const users = await this.userRepository.find();
      this.logger.log(`Fetched ${users.length} users`);

      // Exclude password from the returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return users.map(({ password: _password, ...safeUser }) => safeUser);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * Find a user by ID or Email
   * @param term - User ID or Email
   * @returns The found user without password or undefined if not found
   * @throws BadRequestException if the term is invalid
   * @throws NotFoundException if the user is not found
   */
  async findOne(term: string): Promise<Omit<User, "password"> | undefined> {
    try {
      if (!term || typeof term !== "string") {
        throw new BadRequestException("Invalid ID or Email format.");
      }

      let user: User | null;

      const isUUID = /^[0-9a-fA-F-]{36}$/.test(term);
      if (isUUID) {
        user = await this.userRepository.findOneBy({ id: term });
      } else {
        user = await this.userRepository.findOneBy({ email: term });
      }

      if (!user) {
        this.logger.warn(`User with ${term} not found`);
        throw new NotFoundException(`User with ${term} not found`);
      }

      this.logger.log(`User found: ${user.email}`);

      // Exclude password from the returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...safeUser } = user;
      return safeUser;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * This method is similar to findOne but returns the user including the password for Auth purposes.
   * @param term - User ID or Email
   * @returns The found user including password or undefined if not found
   * @throws BadRequestException if the term is invalid
   * @throws NotFoundException if the user is not found
   */
  async findOneWithPassword(term: string): Promise<User | undefined> {
    try {
      if (!term || typeof term !== "string") {
        throw new BadRequestException("Invalid ID or Email format.");
      }

      let user: User | null;

      const isUUID = /^[0-9a-fA-F-]{36}$/.test(term);
      if (isUUID) {
        user = await this.userRepository.findOneBy({ id: term });
      } else {
        user = await this.userRepository.findOneBy({ email: term });
      }

      if (!user) {
        this.logger.warn(`User with ${term} not found`);
        throw new NotFoundException(`User with ${term} not found`);
      }

      this.logger.log(`User found: ${user.email}`);
      return user;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * Update a user by ID
   * @param id - User ID (UUID)
   * @param updateUserDto - Data transfer object for updating a user
   * @returns updated user without password or undefined if error occurs
   * @throws BadRequestException if the request is invalid
   * @throws NotFoundException if the user is not found
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto
  ): Promise<Omit<User, "password"> | undefined> {
    try {
      await this.findOne(id);

      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      await this.userRepository.update(id, updateUserDto);
      this.logger.log(`User updated: ${id}`);

      const updatedUser = await this.findOne(id);
      return updatedUser;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * Promote a user to admin, this is for testing purposes. Should be removed in production.
   * @param email - User email to promote to admin
   * @returns a message indicating the result of the promotion or undefined if error occurs
   * @throws NotFoundException if the user is not found
   */
  async createAdmin(email: string): Promise<{ message: string } | undefined> {
    this.logger.log(`Promoting user to admin: ${email}`);
    try {
      const user = await this.userRepository.findOneBy({ email });
      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      user.role = "admin";
      await this.userRepository.save(user);
      this.logger.log(`User promoted to admin: ${user.email}`);
      return { message: `User with email ${email} is now an admin` };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * Delete a user by ID
   * @param id - User ID (UUID)
   * @returns a message indicating the result of the deletion or undefined if error occurs
   * @throws NotFoundException if the user is not found
   */
  async remove(id: string): Promise<{ message: string } | undefined> {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found, cannot delete`);
      }

      await this.userRepository.remove(user);
      this.logger.log(`User removed: ${user.email}`);

      return { message: `User with ID ${id} removed successfully` };
    } catch (error) {
      this.handleExceptions(error);
    }
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

    // Handle unique constraint violation (e.g., duplicate title) from postgres
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      throw new BadRequestException((error as { detail?: string }).detail);
    }

    // Unexpected errors
    throw new InternalServerErrorException(
      `Unexpected error, for more detail check server logs -> ${
        typeof error === "object" && error !== null && "detail" in error
          ? (error as { detail?: string }).detail
          : String(error)
      }`
    );
  }
}
