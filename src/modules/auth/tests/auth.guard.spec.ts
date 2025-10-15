import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

class AuthGuard {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic: boolean = Boolean(
      this.reflector?.get && this.reflector.get("isPublic", context.getHandler?.())
    );
    if (isPublic) return true;

    type HttpRequest = {
      headers?: Record<string, string | undefined>;
      user?: unknown;
    };

    const req = context.switchToHttp().getRequest<HttpRequest>();
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
    if (!authHeader) {
      throw new UnauthorizedException();
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
      throw new UnauthorizedException();
    }
    const [, token] = parts;

    try {
      const payload = await this.jwtService.verifyAsync<{ email?: string; sub?: string }>(token);
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let reflector: Partial<Reflector>;

  const makeCtx = (headers: Record<string, any>, reqUser = undefined) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers, user: reqUser }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };
    reflector = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: Reflector, useValue: reflector },
        // si tu AuthGuard requiere ConfigService u otros, añade mocks aquí
        { provide: "ConfigService", useValue: {} },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("permite si la ruta es pública (metadata 'isPublic' === true)", async () => {
    (reflector.get as jest.Mock).mockReturnValue(true); // público
    const ctx = makeCtx({});
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(reflector.get).toHaveBeenCalled();
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it("deniega si no existe header Authorization y no es público", async () => {
    (reflector.get as jest.Mock).mockReturnValue(false); // no público
    const ctx = makeCtx({});
    // Dependiendo de implementación puede devolver false o lanzar excepción.
    // Aceptamos tanto false como excepción UnauthorizedException.
    try {
      const res = await guard.canActivate(ctx);
      expect(res).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(UnauthorizedException);
    }
  });

  it("permite y adjunta user cuando token válido", async () => {
    (reflector.get as jest.Mock).mockReturnValue(false); // no público
    const payload = { email: "a@b.com", sub: "1" };
    jwtService.verifyAsync.mockResolvedValueOnce(payload);

    const ctx = makeCtx({ authorization: "Bearer valid.token.here" }, undefined);
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    // verifyAsync fue llamado con el token (sin 'Bearer ')
    expect(jwtService.verifyAsync).toHaveBeenCalledWith("valid.token.here");
  });

  it("deniega si token inválido", async () => {
    (reflector.get as jest.Mock).mockReturnValue(false); // no público
    jwtService.verifyAsync.mockRejectedValueOnce(new Error("invalid token"));

    const ctx = makeCtx({ authorization: "Bearer bad.token" }, undefined);
    try {
      const res = await guard.canActivate(ctx);
      expect(res).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(UnauthorizedException);
    }
  });
});
