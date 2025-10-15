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

  async create(createUserDto: CreateUserDto) {
    try {
      const { email, password, role } = createUserDto;

      const existingUser = await this.userRepository.findOneBy({ email });
      if (existingUser) {
        throw new BadRequestException(`User with email ${email} already exists`);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        role,
      });

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

  async findAll() {
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

  async findOne(term: string) {
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

  async update(updateUserDto: UpdateUserDto) {
    try {
      const { id, ...data } = updateUserDto;
      await this.findOne(id);

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      await this.userRepository.update(id, data);
      this.logger.log(`User updated: ${id}`);

      const updatedUser = await this.findOne(id);
      return updatedUser;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
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
