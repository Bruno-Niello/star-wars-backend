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
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { ConflictException, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { User } from "../../users/entities/user.entity";
import { CreateUserDto } from "../../users/dto/create-user.dto";
import { AuthService } from "../auth.service";
import { UsersService } from "../../users/users.service";
import { RefreshTokenDto } from "../dto/refresh-token.dto";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue("hashedPassword"),
}));

const mockUser: User = {
  id: "uuid-123",
  email: "test@example.com",
  password: "hashedPassword",
  name: "Test User",
  role: "user",
  created_at: new Date(),
  updated_at: new Date(),
};

const mockSafeUser = {
  id: mockUser.id,
  email: mockUser.email,
  name: mockUser.name,
  role: mockUser.role,
  created_at: mockUser.created_at,
  updated_at: mockUser.updated_at,
};

const mockCreateUserDto: CreateUserDto = {
  email: "newuser@example.com",
  name: "New User",
  password: "plainPassword",
};

const mockJwtPayload = {
  email: mockUser.email,
  id: mockUser.id,
  name: mockUser.name,
  role: mockUser.role,
};
const mockAccessToken = "mockAccessToken";
const mockRefreshToken = "mockRefreshToken";

describe("AuthService", () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneWithPassword: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();

    (usersService.findOneWithPassword as jest.Mock).mockClear();
    (jwtService.signAsync as jest.Mock).mockClear();
  });

  it("debe estar definido", () => {
    expect(authService).toBeDefined();
  });

  describe("validateUser", () => {
    it("debe retornar el usuario sin la contraseña si las credenciales son válidas", async () => {
      (usersService.findOneWithPassword as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(mockUser.email, "plainPassword");

      expect(usersService.findOneWithPassword).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith("plainPassword", mockUser.password);
      expect(result).toEqual(mockSafeUser);
    });

    it("debe retornar null si el usuario no existe", async () => {
      (usersService.findOneWithPassword as jest.Mock).mockResolvedValue(null);

      const result = await authService.validateUser(mockUser.email, "plainPassword");

      expect(usersService.findOneWithPassword).toHaveBeenCalledWith(mockUser.email);
      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("debe retornar null si la contraseña es incorrecta", async () => {
      (usersService.findOneWithPassword as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser(mockUser.email, "wrongPassword");

      expect(usersService.findOneWithPassword).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith("wrongPassword", mockUser.password);
      expect(result).toBeNull();
    });

    it("debe retornar null en caso de excepción en la búsqueda", async () => {
      (usersService.findOneWithPassword as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const result = await authService.validateUser(mockUser.email, "plainPassword");

      expect(result).toBeNull();
    });
  });

  describe("signUp", () => {
    it("debe registrar un nuevo usuario y retornar tokens", async () => {
      (usersService.findOneWithPassword as jest.Mock).mockRejectedValue(new NotFoundException());
      (usersService.create as jest.Mock).mockResolvedValue(mockSafeUser);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await authService.signUp(mockCreateUserDto);

      expect(usersService.findOneWithPassword).toHaveBeenCalledWith(mockCreateUserDto.email);
      expect(usersService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(jwtService.signAsync).toHaveBeenCalledWith(mockSafeUser);
      expect(jwtService.signAsync).toHaveBeenCalledWith(mockSafeUser, {
        expiresIn: "1d",
      });
      expect(result).toEqual({
        ...mockSafeUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it("debe lanzar ConflictException si el usuario ya existe", async () => {
      (usersService.findOneWithPassword as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.signUp(mockCreateUserDto)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it("debe lanzar UnauthorizedException si la creación del usuario falla", async () => {
      (usersService.findOneWithPassword as jest.Mock).mockRejectedValue(new NotFoundException());
      (usersService.create as jest.Mock).mockResolvedValue(null);

      await expect(authService.signUp(mockCreateUserDto)).rejects.toThrow(UnauthorizedException);
    });

    it("debe propagar errores de UsersService que no son NotFoundException", async () => {
      const error = new Error("Database connection failed");
      (usersService.findOneWithPassword as jest.Mock).mockRejectedValue(error);

      await expect(authService.signUp(mockCreateUserDto)).rejects.toThrow(error);
    });
  });

  describe("signIn", () => {
    beforeEach(() => {
      jest.spyOn(authService, "validateUser").mockImplementation(
        async (email, pwd) => {
          if (email === mockUser.email && pwd === "plainPassword") {
            return mockSafeUser;
          }
          return null;
        }
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("debe autenticar un usuario y retornar tokens", async () => {
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await authService.signIn(mockUser.email, "plainPassword");

      expect(authService.validateUser).toHaveBeenCalledWith(mockUser.email, "plainPassword");
    });
  });

  describe("refreshToken", () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: mockRefreshToken,
    };

    it("debe retornar nuevos tokens si el token de refresco es válido", async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(mockJwtPayload);
      (usersService.findOneWithPassword as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce("newAccessToken")
        .mockResolvedValueOnce("newRefreshToken");

      const result = await authService.refreshToken(refreshTokenDto);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockRefreshToken);
      expect(usersService.findOneWithPassword).toHaveBeenCalledWith(mockJwtPayload.email);
      expect(result).toEqual({
        accessToken: "newAccessToken",
        refreshToken: "newRefreshToken",
      });
    });

    it("debe lanzar UnauthorizedException si el token de refresco no es válido/expirado (falla verifyAsync)", async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error("Invalid token"));

      await expect(authService.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("debe lanzar UnauthorizedException si el usuario del token no existe", async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(mockJwtPayload);
      (usersService.findOneWithPassword as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("debe lanzar UnauthorizedException si falla la generación de tokens", async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(mockJwtPayload);
      (usersService.findOneWithPassword as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.signAsync as jest.Mock).mockRejectedValue(new Error("JWT signing error"));

      await expect(authService.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
