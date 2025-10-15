import { Reflector } from "@nestjs/core";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { RolesGuard } from "../guards/roles.guard";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Partial<Reflector>;

  const mockContext = (user: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: (): { user: unknown } => ({ user }),
      }),
      getHandler: jest.fn(() => ({})),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    };
    guard = new RolesGuard(reflector as Reflector);
  });

  it("permite cuando no hay metadata de roles (no está protegido)", () => {
    (reflector.get as jest.Mock).mockReturnValue(undefined);
    const ctx = mockContext({ roles: ["ADMIN"] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("permite si el usuario tiene alguno de los roles requeridos (roles array)", () => {
    (reflector.get as jest.Mock).mockReturnValue(["ADMIN", "MOD"]);
    const ctx = mockContext({ roles: ["USER", "ADMIN"] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("permite si el usuario tiene el role como string", () => {
    (reflector.get as jest.Mock).mockReturnValue(["ADMIN"]);
    const ctx = mockContext({ role: "ADMIN" });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("lanza UnauthorizedException si el usuario no tiene los roles requeridos", () => {
    (reflector.get as jest.Mock).mockReturnValue(["ADMIN"]);
    const ctx = mockContext({ roles: ["USER"] });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it("lanza UnauthorizedException si no existe usuario en la request", () => {
    (reflector.get as jest.Mock).mockReturnValue(["ADMIN"]);
    const ctx = mockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
