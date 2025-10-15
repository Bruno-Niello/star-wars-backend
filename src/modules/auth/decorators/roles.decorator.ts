import { SetMetadata } from "@nestjs/common";
import { ROLES, ROLES_KEY } from "../guards/roles";

export const Roles = (...roles: Array<keyof typeof ROLES>) => SetMetadata(ROLES_KEY, roles);
