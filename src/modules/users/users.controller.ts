import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthGuard } from "../auth/guards/auth.guard";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiResponse({ status: 201, description: "The user has been successfully created." })
  @ApiResponse({ status: 400, description: "Bad Request. Invalid input data." })
  @ApiResponse({ status: 403, description: "Forbidden. Only admins can create users." })
  @ApiOperation({ summary: "Create a new user" })
  create(@Body() createUserDto: CreateUserDto) {
    console.log("llegaste al controller");
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiResponse({ status: 200, description: "List of users retrieved successfully." })
  @ApiResponse({ status: 403, description: "Forbidden. Only admins can access the list of users." })
  @ApiOperation({ summary: "Retrieve a list of all users" })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiResponse({ status: 200, description: "User retrieved successfully." })
  @ApiResponse({ status: 404, description: "User not found." })
  @ApiResponse({ status: 403, description: "Forbidden. Only admins can access user details." })
  @ApiOperation({ summary: "Retrieve a user by their ID" })
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, description: "User updated successfully." })
  @ApiResponse({ status: 404, description: "User not found." })
  @ApiResponse({ status: 403, description: "Forbidden. Only admins can update user details." })
  @ApiOperation({ summary: "Update a user by their ID" })
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "User deleted successfully." })
  @ApiResponse({ status: 404, description: "User not found." })
  @ApiResponse({ status: 403, description: "Forbidden. Only admins can delete users." })
  @ApiOperation({ summary: "Delete a user by their ID" })
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.usersService.remove(id);
  }

  /* 
    This endpoint is just for testing purposes. It should be removed in production.
    It updates a user to have the admin role based on their email.
    It's public so you can call it without being admin/authenticated.
  **/
  @Public()
  @Post("create-admin")
  @ApiResponse({ status: 200, description: "User promoted to admin successfully." })
  @ApiResponse({ status: 404, description: "User not found." })
  @ApiResponse({ status: 400, description: "Bad Request. Invalid input data." })
  @ApiOperation({ summary: "Promote a user to admin by their email (for testing only)" })
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.usersService.createAdmin(createAdminDto.email);
  }
}
