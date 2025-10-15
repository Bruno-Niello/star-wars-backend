import { Test, TestingModule } from "@nestjs/testing";
import { RolesGuard } from "./roles.guard";
import { Reflector } from "@nestjs/core";
import { UnauthorizedException } from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";
import { ROLES } from "./roles";

describe("RolesGuard", (): void => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: Partial<ExecutionContext>;

  beforeEach(async (): Promise<void> => {
    reflector = { get: jest.fn() } as unknown as Reflector;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: reflector }],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it("should be defined", (): void => {
    expect(rolesGuard).toBeDefined();
  });

  describe("canActivate", (): void => {
    it("should return true if route is public", (): void => {
      reflector.get = jest.fn().mockReturnValue(true);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: ROLES.USER } }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it("should throw UnauthorizedException if user role is not present", (): void => {
      reflector.get = jest.fn().mockReturnValue(undefined);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: {} }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => rolesGuard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it("should return true if user role matches admin role and admin role is defined", (): void => {
      reflector.get = jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(ROLES.ADMIN);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: ROLES.ADMIN } }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it("should throw UnauthorizedException if user role does not match required roles", (): void => {
      jest.spyOn(reflector, "get").mockImplementation(key => {
        if (key === "roles") {
          return [ROLES.ADMIN];
        }
        return null;
      });

      expect(() => rolesGuard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        UnauthorizedException
      );
    });

    it("should return true if user role matches one of the required roles", (): void => {
      reflector.get = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce([ROLES.USER]);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: ROLES.USER } }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it("should return true if user role is authorized and not admin", (): void => {
      reflector.get = jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([ROLES.USER])
        .mockReturnValueOnce(undefined);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: ROLES.USER } }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(rolesGuard.canActivate(context)).toBe(true);
    });
  });
});
