import { CustomDecorator, SetMetadata } from "@nestjs/common";
import { PUBLIC_KEY } from "../guards/roles";

export const Public = (): CustomDecorator<string> => SetMetadata(PUBLIC_KEY, true);
