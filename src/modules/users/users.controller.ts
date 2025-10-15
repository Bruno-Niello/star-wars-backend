import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ApiTags } from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    console.log("llegaste al controller");
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.usersService.remove(id);
  }

  /* 
    This endpoint is just for testing purposes. It should be removed in production.
    It updates a user to have the admin role based on their email.
  **/
  @Post("create-admin")
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.usersService.createAdmin(createAdminDto.email);
  }
}
