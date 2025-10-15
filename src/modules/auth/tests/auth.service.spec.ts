import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";

interface CreateUserDto {
  email: string;
  name: string;
  password: string;
}

describe("AuthService", () => {
  let service: AuthService;

  const mockUsersService = {
    findOneWithPassword: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: "UsersService", useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      // Bind the token used by constructor injection (UsersService is imported by type in code).
      .overrideProvider("UsersService")
      .useValue(mockUsersService)
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateUser", () => {
    it("should return user without password when credentials are valid", async () => {
      const plaintext = "validPass";
      const hash = await bcrypt.hash(plaintext, 10);
      const userWithPwd = { id: "1", email: "a@b.com", password: hash, name: "A" };

      mockUsersService.findOneWithPassword.mockResolvedValueOnce(userWithPwd);

      const result = await service.validateUser("a@b.com", plaintext);

      expect(result).toBeDefined();
      const safe = result as { password?: unknown; email?: string } | null;
      expect(safe?.password).toBeUndefined();
      expect(safe?.email).toBe("a@b.com");
      expect(mockUsersService.findOneWithPassword).toHaveBeenCalledWith("a@b.com");
    });

    it("should return null when user not found", async () => {
      mockUsersService.findOneWithPassword.mockResolvedValueOnce(null);

      const result = await service.validateUser("not@found.com", "any");

      expect(result).toBeNull();
    });

    it("should return null when password does not match", async () => {
      const hash = await bcrypt.hash("otherpass", 10);
      mockUsersService.findOneWithPassword.mockResolvedValueOnce({
        email: "u@u.com",
        password: hash,
      });

      const result = await service.validateUser("u@u.com", "wrongpass");

      expect(result).toBeNull();
    });

    it("should throw ConflictException when user already exists", async () => {
      mockUsersService.findOneWithPassword.mockResolvedValueOnce({
        id: "1",
        email: "exists@e.com",
      });

      await expect(
        service.signUp({ email: "exists@e.com", name: "X", password: "p" } as CreateUserDto)
      ).rejects.toBeInstanceOf(ConflictException);

      expect(mockUsersService.findOneWithPassword).toHaveBeenCalledWith("exists@e.com");
    });

    it("should create user and return tokens", async () => {
      const created = { id: "10", email: "new@e.com", name: "New" };
      mockUsersService.create.mockResolvedValueOnce(created);
      mockJwtService.signAsync.mockResolvedValueOnce("access-token");
      mockJwtService.signAsync.mockResolvedValueOnce("refresh-token");

      const res = await service.signUp({
        email: "new@e.com",
        name: "New",
        password: "pass",
      } as CreateUserDto);

      expect(res).toBeDefined();
      expect(res.accessToken).toBe("access-token");
      expect(res.refreshToken).toBe("refresh-token");
      expect(mockUsersService.create).toHaveBeenCalled();
    });
  });

  describe("signIn", () => {
    it("should throw Unauthorized when validateUser returns null", async () => {
      jest.spyOn(service, "validateUser").mockResolvedValueOnce(null);

      await expect(service.signIn("a@b.com", "p")).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("should return user + tokens when credentials valid", async () => {
      const safeUser: {
        id: string;
        email: string;
        name: string;
        role: "admin" | "user";
        created_at: Date;
        updated_at: Date;
      } = {
        id: "1",
        email: "ok@ok.com",
        name: "Ok",
        role: "user",
        created_at: new Date(),
        updated_at: new Date(),
      };
      jest.spyOn(service, "validateUser").mockResolvedValueOnce(safeUser);
      mockJwtService.signAsync.mockResolvedValueOnce("access");
      mockJwtService.signAsync.mockResolvedValueOnce("refresh");

      const res = await service.signIn("ok@ok.com", "p");

      expect(res).toMatchObject({
        id: "1",
        email: "ok@ok.com",
        accessToken: "access",
        refreshToken: "refresh",
      });
    });
  });

  describe("refreshToken", () => {
    it("should return new tokens when refresh token valid", async () => {
      const decoded = { email: "r@r.com" };
      mockJwtService.verifyAsync.mockResolvedValueOnce(decoded as any);
      const user = { id: "u1", email: "r@r.com", password: "hash" };
      mockUsersService.findOneWithPassword.mockResolvedValueOnce(user);
      mockJwtService.signAsync.mockResolvedValueOnce("new-access");
      mockJwtService.signAsync.mockResolvedValueOnce("new-refresh");

      const res = await service.refreshToken({ refreshToken: "rt" });

      expect(res).toBeDefined();
      expect(res.accessToken).toBe("new-access");
      expect(res.refreshToken).toBe("new-refresh");
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith("rt");
    });

    it("should throw Unauthorized when refresh token invalid", async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(new Error("invalid"));

      await expect(service.refreshToken({ refreshToken: "bad" })).rejects.toBeInstanceOf(
        UnauthorizedException
      );
    });
  });
});
