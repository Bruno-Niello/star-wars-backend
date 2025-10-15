import { Test, TestingModule } from "@nestjs/testing";
import { AuthGuard } from "./auth.guard";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

describe("AuthGuard", (): void => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;
  let configService: ConfigService;

  beforeEach(async (): Promise<void> => {
    jwtService = { verifyAsync: jest.fn() } as unknown as JwtService;
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    configService = { get: jest.fn() } as unknown as ConfigService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: Reflector, useValue: reflector },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it("should be defined", (): void => {
    expect(authGuard).toBeDefined();
  });

  describe("canActivate", (): void => {
    it("should return true if the route is public", async (): Promise<void> => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(true);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({}) as Request,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(await authGuard.canActivate(context)).toBe(true);
    });

    it("should throw UnauthorizedException if token is not present", async (): Promise<void> => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(false);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }) as Request,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if token is invalid", async (): Promise<void> => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
      configService.get = jest.fn().mockReturnValue("test-secret");
      jwtService.verifyAsync = jest.fn().mockRejectedValue(new Error());

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: "Bearer invalid-token" } }) as Request,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("should set user on request if token is valid", async (): Promise<void> => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
      configService.get = jest.fn().mockReturnValue("test-secret");
      jwtService.verifyAsync = jest.fn().mockResolvedValue({ id: 1 });

      const context = {
        switchToHttp: () => ({
          getRequest: () =>
            ({
              headers: { authorization: "Bearer valid-token" },
              user: {
                id: 1,
                email: "test@test.com",
                role: "USER",
                firstName: "example",
                lastName: "example",
                created: "2024-08-25T03:46:42.369Z",
                edited: "2024-08-25T04:59:43.230Z",
                iat: 1724700512,
                exp: 1724786912,
              },
            }) as unknown as Request,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      const result = await authGuard.canActivate(context);

      const request = context.switchToHttp().getRequest();

      expect(request["user"]).toHaveProperty("id");
      expect(request["user"]).toHaveProperty("email");
      expect(request["user"]).toHaveProperty("role");
      expect(request["user"]).toHaveProperty("firstName");
      expect(request["user"]).toHaveProperty("lastName");
      expect(request["user"]).toHaveProperty("created");
      expect(request["user"]).toHaveProperty("edited");
      expect(request["user"]).toHaveProperty("iat");
      expect(request["user"]).toHaveProperty("exp");

      expect(result).toBe(true);
    });
  });

  describe("extractTokenFromHeader", (): void => {
    it("should extract token from Bearer header", (): void => {
      const request = {
        headers: { authorization: "Bearer some-token" },
      } as Request;
      const token = authGuard["extractTokenFromHeader"](request);
      expect(token).toBe("some-token");
    });

    it("should return undefined if the header is missing", (): void => {
      const request = { headers: {} } as Request;
      const token = authGuard["extractTokenFromHeader"](request);
      expect(token).toBeUndefined();
    });

    it("should return undefined if the header is not Bearer", (): void => {
      const request = {
        headers: { authorization: "Basic some-token" },
      } as Request;
      const token = authGuard["extractTokenFromHeader"](request);
      expect(token).toBeUndefined();
    });
  });
});
