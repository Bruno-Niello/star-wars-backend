import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "../users.controller";
import { UsersService } from "../users.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { CreateAdminDto } from "../dto/create-admin.dto";

// 1. Mock de los Guards para que SIEMPRE permitan la activación
// Esto aísla el test de la lógica de autenticación/autorización real.
jest.mock("../../auth/guards/auth.guard", () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));
jest.mock("../../auth/guards/roles.guard", () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe("UsersController", () => {
  let controller: UsersController;

  // 2. Mock del servicio, definiendo solo los métodos que usa el controlador.
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
    // Limpiamos los mocks después de cada prueba
    jest.clearAllMocks();
  });

  // --- Test de Inicialización ---
  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ----------------------------------------------------------------------

  describe("create", () => {
    it("should call usersService.create with the correct DTO and return the created user", async () => {
      // Arrange
      const dto: CreateUserDto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      } as CreateUserDto;
      const createdUser = { id: "uuid-1", ...dto };
      mockUsersService.create.mockResolvedValueOnce(createdUser);

      // Act & Assert
      await expect(controller.create(dto)).resolves.toEqual(createdUser);

      // Assert: Verificar que el servicio fue llamado
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------------

  describe("findAll", () => {
    it("should call usersService.findAll and return a list of users", async () => {
      // Arrange
      const userList = [{ id: "uuid-1", email: "a@b.com" }];
      mockUsersService.findAll.mockResolvedValueOnce(userList);

      // Act & Assert
      await expect(controller.findAll()).resolves.toEqual(userList);

      // Assert
      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(mockUsersService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------------

  describe("findOne", () => {
    const userId = "a9b8c7d6-e5f4-3210-9876-543210fedcba";

    it("should call usersService.findOne with the ID and return the user", async () => {
      // Arrange
      const user = { id: userId, email: "single@user.com" };
      mockUsersService.findOne.mockResolvedValueOnce(user);

      // Act & Assert
      await expect(controller.findOne(userId)).resolves.toEqual(user);

      // Assert
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
      expect(mockUsersService.findOne).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------------

  describe("update", () => {
    const userId = "a9b8c7d6-e5f4-3210-9876-543210fedcba";
    const dto: UpdateUserDto = { role: "admin" } as UpdateUserDto;

    it("should call usersService.update with ID and DTO, and return the updated user", async () => {
      // Arrange
      const updatedUser = { id: userId, email: "user@updated.com", role: "admin" };
      mockUsersService.update.mockResolvedValueOnce(updatedUser);

      // Act & Assert
      await expect(controller.update(userId, dto)).resolves.toEqual(updatedUser);

      // Assert
      expect(mockUsersService.update).toHaveBeenCalledWith(userId, dto);
      expect(mockUsersService.update).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------------

  describe("remove", () => {
    const userId = "a9b8c7d6-e5f4-3210-9876-543210fedcba";

    it("should call usersService.remove with the ID and return the result", async () => {
      // Arrange
      const deleteResult = { affected: 1 };
      mockUsersService.remove.mockResolvedValueOnce(deleteResult);

      // Act & Assert
      await expect(controller.remove(userId)).resolves.toEqual(deleteResult);

      // Assert
      expect(mockUsersService.remove).toHaveBeenCalledWith(userId);
      expect(mockUsersService.remove).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------------

  describe("createAdmin (Public Endpoint)", () => {
    it("should call usersService.createAdmin with the email from the DTO", async () => {
      // Arrange
      const email = "admin_to_create@test.com";
      const dto: CreateAdminDto = { email } as CreateAdminDto;
      const adminUser = { id: "uuid-admin", email, role: "ADMIN" };
      mockUsersService.createAdmin.mockResolvedValueOnce(adminUser);

      // Act & Assert
      await expect(controller.createAdmin(dto)).resolves.toEqual(adminUser);

      // Assert
      expect(mockUsersService.createAdmin).toHaveBeenCalledWith(email);
      expect(mockUsersService.createAdmin).toHaveBeenCalledTimes(1);
    });
  });
});
