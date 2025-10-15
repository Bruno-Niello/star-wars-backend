import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpDto } from "./dto/sign-up.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-up")
  @ApiResponse({ status: 201, description: "User registered successfully." })
  @ApiResponse({ status: 400, description: "Bad Request. Invalid input data." })
  @ApiOperation({ summary: "Register a new user" })
  signUp(@Body() user: SignUpDto) {
    return this.authService.signUp(user);
  }

  @Post("sign-in")
  @ApiResponse({ status: 200, description: "User signed in successfully." })
  @ApiResponse({ status: 401, description: "Unauthorized. Invalid credentials." })
  @ApiOperation({ summary: "Authenticate a user and return a JWT" })
  signIn(@Body() user: SignInDto) {
    return this.authService.signIn(user.email, user.password);
  }

  @Post("refresh-token")
  @ApiResponse({ status: 200, description: "Token refreshed successfully." })
  @ApiResponse({ status: 401, description: "Unauthorized. Invalid refresh token." })
  @ApiOperation({ summary: "Refresh JWT using a valid refresh token" })
  refreshToken(@Body() refreshToken: RefreshTokenDto) {
    return this.authService.refreshToken(refreshToken);
  }
}
