//-------------------------------------------------------------------------//
//-------------------------------IMPORTANTE--------------------------------//
//-------------------------------------------------------------------------//
//    Por falta de tiempo tuve que utilizar IA                             //
//     para generar y arreglar estos tests.                                //
//    He intentado mantener la lógica original en la medida de lo posible. //
//    Hay muchos errores de TS y linter que no he podido corregir.         //
//    Lamento el resultado. - Bruno                                        //
//-------------------------------------------------------------------------//
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "../users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

// Mock del repositorio
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createUserDto = {
  email: "test@example.com",
  password: "Password123",
  role: "USER",
  fullName: "Test User",
};
const userEntity = {
  id: "uuid-test-1",
  email: createUserDto.email,
  password: "hashedPassword123",
  role: "USER",
  fullName: "Test User",
};
const safeUser = {
  id: "uuid-test-1",
  email: createUserDto.email,
  role: "USER",
  fullName: "Test User",
};

// Mocks del repositorio
const createMockRepository = (): MockRepository<User> => ({
  findOneBy: jest.fn(),
  create: jest.fn().mockReturnValue(userEntity), // create siempre devuelve la entidad mock
  save: jest.fn().mockResolvedValue(userEntity), // save siempre devuelve la entidad mock
  find: jest.fn().mockResolvedValue([userEntity]),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  remove: jest.fn().mockResolvedValue(userEntity),
});

// Mock de bcrypt.hash (para controlar el hasheo)
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword123"),
}));

describe("UsersService", () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        // Proporcionamos el token del repositorio con nuestro mock
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));

    // Espía el método findOne del servicio si es necesario
    // Nota: findOneWithPassword no es espiado por defecto para que podamos probarlo.
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Test de Inicialización ---
  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ----------------------------------------------------------------------
  // ## create
  // ----------------------------------------------------------------------
  describe("create", () => {
    it("should hash the password, save the user, and return the safe user object", async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValueOnce(null); // No existe usuario

      // Act
      const result = await service.create(createUserDto);

      // Assert
      // 1. Verificar que se buscó si existe por email
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email: createUserDto.email });
      // 2. Verificar que se ha hasheado la contraseña
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      // 3. Verificar que se llamó a create con la contraseña hasheada
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: "hashedPassword123" })
      );
      // 4. Verificar que se ha guardado
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      // 5. Verificar que se retornó el objeto sin la contraseña
      expect(result).toEqual(safeUser);
    });

    it("should throw BadRequestException if user already exists", async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValueOnce(userEntity); // El usuario ya existe

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it("should handle unique constraint (23505) database error", async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValueOnce(null); // No existe
      const mockDBError = { code: "23505", detail: "Key (email) already exists." };
      userRepository.save.mockRejectedValueOnce(mockDBError); // Falla al guardar por duplicado

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  // ----------------------------------------------------------------------
  // ## findAll
  // ----------------------------------------------------------------------
  describe("findAll", () => {
    it("should return a list of users without passwords", async () => {
      // Arrange
      userRepository.find.mockResolvedValueOnce([userEntity, userEntity]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(userRepository.find).toHaveBeenCalledTimes(1);
      // El resultado debe ser un array de dos usuarios seguros
      expect(result).toEqual([safeUser, safeUser]);
    });
  });

  // ----------------------------------------------------------------------
  // ## findOne
  // ----------------------------------------------------------------------
  describe("findOne", () => {
    it("should find by ID (UUID) and return safe user", async () => {
      // Arrange
      const uuid = "a9b8c7d6-e5f4-3210-9876-543210fedcba";
      userRepository.findOneBy.mockResolvedValueOnce(userEntity);

      // Act
      const result = await service.findOne(uuid);

      // Assert
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: uuid });
      expect(result).toEqual(safeUser);
    });

    it("should find by email and return safe user", async () => {
      // Arrange
      const email = "find@email.com";
      userRepository.findOneBy.mockResolvedValueOnce(userEntity);

      // Act
      const result = await service.findOne(email);

      // Assert
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(result).toEqual(safeUser);
    });

    it("should throw NotFoundException if user is not found", async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.findOne("non-existent")).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException for invalid term format (not string)", async () => {
      // @ts-expect-error Testing invalid input
      await expect(service.findOne(null)).rejects.toThrow(BadRequestException);
    });
  });

  // ----------------------------------------------------------------------
  // ## findOneWithPassword
  // ----------------------------------------------------------------------
  describe("findOneWithPassword", () => {
    it("should find by email and return user including the password", async () => {
      // Arrange
      const email = "auth@user.com";
      userRepository.findOneBy.mockResolvedValueOnce(userEntity);

      // Act
      const result = await service.findOneWithPassword(email);

      // Assert
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
      // Debe retornar el objeto COMPLETO, incluyendo el password
      expect(result).toEqual(userEntity);
    });
  });

  // ----------------------------------------------------------------------
  // ## update
  // ----------------------------------------------------------------------
  describe("update", () => {
    const userId = "uuid-to-update";

    // Espiamos findOne del servicio para controlar su comportamiento
    let findOneSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mockeamos findOne para que 'update' sepa que el usuario existe
      findOneSpy = jest.spyOn(service, "findOne" as any).mockResolvedValue(safeUser);
    });

    it("should update user data without hashing if password is not provided", async () => {
      // Arrange
      const updateDto = { fullName: "New Name" };
      userRepository.update.mockResolvedValueOnce({ affected: 1 });

      // Act
      await service.update(userId, updateDto);

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith(userId); // Se verifica que el usuario existe
      expect(userRepository.update).toHaveBeenCalledWith(userId, updateDto); // Se llama a update
      expect(bcrypt.hash).not.toHaveBeenCalled(); // No se hashea
      // Se llama a findOne de nuevo para devolver el objeto actualizado
      expect(findOneSpy).toHaveBeenCalledTimes(2);
    });

    it("should hash the password and update if password is provided", async () => {
      // Arrange
      const updateDto = { password: "newPassword123" };
      userRepository.update.mockResolvedValueOnce({ affected: 1 });

      // Act
      await service.update(userId, updateDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledTimes(1); // Se hashea
      expect(userRepository.update).toHaveBeenCalledWith(userId, { password: "hashedPassword123" }); // Se actualiza con el hash
    });

    it("should propagate NotFoundException if findOne fails (user not found)", async () => {
      // Arrange
      findOneSpy.mockRestore(); // Deshacemos el mock de beforeEach
      jest
        .spyOn(service, "findOne" as any)
        .mockRejectedValue(new NotFoundException("User not found"));

      // Act & Assert
      await expect(service.update(userId, { fullName: "Test" })).rejects.toThrow(NotFoundException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------------
  // ## createAdmin
  // ----------------------------------------------------------------------
  describe("createAdmin", () => {
    it("should update user role to 'admin'", async () => {
      // Arrange
      const email = "user@promote.com";
      const userToPromote = { ...userEntity, email, role: "USER" };
      const promotedUser = { ...userToPromote, role: "admin" };
      userRepository.findOneBy.mockResolvedValueOnce(userToPromote);
      userRepository.save.mockResolvedValueOnce(promotedUser);

      // Act
      const result = await service.createAdmin(email);

      // Assert
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
      // Se verifica que save fue llamado con el rol 'admin'
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }));
      expect(result).toEqual({ message: `User with email ${email} is now an admin` });
    });

    it("should throw NotFoundException if user is not found", async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.createAdmin("missing@user.com")).rejects.toThrow(NotFoundException);
    });
  });

  // ----------------------------------------------------------------------
  // ## remove
  // ----------------------------------------------------------------------
  describe("remove", () => {
    const userId = "uuid-to-delete";

    it("should find the user and call userRepository.remove", async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValueOnce(userEntity);

      // Act
      const result = await service.remove(userId);

      // Assert
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(userRepository.remove).toHaveBeenCalledWith(userEntity);
      expect(result).toEqual({ message: `User with ID ${userId} removed successfully` });
    });

    it("should throw NotFoundException if user is not found", async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
      expect(userRepository.remove).not.toHaveBeenCalled();
    });
  });
});
