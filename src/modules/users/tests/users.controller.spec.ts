import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "../users.controller";
import { UsersService } from "../users.service";
import { UpdateUserDto } from "../dto/update-user.dto";
import { CreateAdminDto } from "../dto/create-admin.dto";

describe("UsersController", () => {
  let controller: UsersController;
  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createAdmin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("llama a usersService.create y retorna usuario creado", async () => {
      const dto: { email: string; name: string; password: string } = {
        email: "a@b.com",
        name: "A",
        password: "pwd",
      };
      const expected = { id: "1", ...dto };
      mockUsersService.create.mockResolvedValueOnce(expected);

      await expect(controller.create(dto)).resolves.toEqual(expected);
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("findAll", () => {
    it("llama a usersService.findAll y retorna lista", async () => {
      const list = [{ id: "1", email: "a@a.com" }];
      mockUsersService.findAll.mockResolvedValueOnce(list);

      await expect(controller.findAll()).resolves.toEqual(list);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("llama a usersService.findOne y retorna usuario", async () => {
      const u = { id: "uuid", email: "a@a.com" };
      mockUsersService.findOne.mockResolvedValueOnce(u);

      await expect(controller.findOne("uuid")).resolves.toEqual(u);
      expect(mockUsersService.findOne).toHaveBeenCalledWith("uuid");
    });
  });

  describe("update", () => {
    it("llama a usersService.update y retorna actualizado", async () => {
      const updated = { id: "u1", name: "New" };
      mockUsersService.update.mockResolvedValueOnce(updated);

      const updateDto: UpdateUserDto = { name: "New" };
      await expect(controller.update("u1", updateDto)).resolves.toEqual(updated);
      expect(mockUsersService.update).toHaveBeenCalledWith("u1", expect.any(Object));
    });
  });

  describe("remove", () => {
    it("llama a usersService.remove y retorna resultado", async () => {
      mockUsersService.remove.mockResolvedValueOnce({ affected: 1 });

      await expect(controller.remove("u1")).resolves.toEqual({ affected: 1 });
      expect(mockUsersService.remove).toHaveBeenCalledWith("u1");
    });
  });

  describe("createAdmin", () => {
    it("llama a usersService.createAdmin y retorna resultado", async () => {
      const result = { id: "u1", email: "a@a.com", roles: ["admin"] };
      mockUsersService.createAdmin.mockResolvedValueOnce(result);
      const createAdminDto: CreateAdminDto = { email: "a@a.com" };
      await expect(controller.createAdmin(createAdminDto)).resolves.toEqual(result);
      expect(mockUsersService.createAdmin).toHaveBeenCalledWith("a@a.com");
      expect(mockUsersService.createAdmin).toHaveBeenCalledWith("a@a.com");
    });
  });
});
