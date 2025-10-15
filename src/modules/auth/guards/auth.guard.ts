import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { PUBLIC_KEY } from "./roles";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger("AuthGuard");
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request: Request = context.switchToHttp().getRequest<Request>();
    try {
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException("No token provided");
      }
      const jwtSecret = process.env.JWT_SECRET || "defaultSecret";
      request["user"] = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: jwtSecret,
      });
    } catch (error: any) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : String(error);
      this.logger.error(errorMessage);
      throw new UnauthorizedException("Invalid token");
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}

interface JwtPayload {
  sub: string;
  email: string;
}
