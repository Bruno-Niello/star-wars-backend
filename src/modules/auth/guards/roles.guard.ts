import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Observable } from "rxjs";
import { ADMIN_KEY, PUBLIC_KEY, ROLES, ROLES_KEY } from "./roles";

interface AuthenticatedRequest extends Request {
  user: {
    role: ROLES;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger("RolesGuard");
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const isPublic = this.reflector.get<boolean>(PUBLIC_KEY, context.getHandler());

      if (isPublic) return true;

      const roles = this.reflector.get<Array<keyof typeof ROLES>>(ROLES_KEY, context.getHandler());

      const admin = this.reflector.get<string>(ADMIN_KEY, context.getHandler());

      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

      const userRole = request?.user?.role;

      if (!userRole) throw new UnauthorizedException("Unauthorized");

      if (roles === undefined) {
        if (!admin || (admin && userRole === (admin as ROLES))) {
          return true;
        } else {
          throw new UnauthorizedException("Unauthorized");
        }
      }

      const isAuth = roles.some((role): boolean => ROLES[role] === userRole);

      if (!isAuth) throw new UnauthorizedException("Unauthorized");

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException("Unauthorized");
    }
  }
}
