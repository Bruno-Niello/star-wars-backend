import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("signUp", () => {
    it("should call AuthService.signUp and return its result", async () => {
      const dto = { email: "a@b.com", name: "A", password: "pwd" };
      const expected = { id: "1", email: dto.email, accessToken: "at", refreshToken: "rt" };
      mockAuthService.signUp.mockResolvedValueOnce(expected);

      await expect(controller.signUp(dto)).resolves.toEqual(expected);
      expect(mockAuthService.signUp).toHaveBeenCalledWith(dto);
    });

    it("should propagate errors from AuthService.signUp", async () => {
      const dto = { email: "err@e.com", name: "E", password: "pwd" };
      mockAuthService.signUp.mockRejectedValueOnce(new Error("boom"));

      await expect(controller.signUp(dto)).rejects.toThrow("boom");
      expect(mockAuthService.signUp).toHaveBeenCalledWith(dto);
    });
  });

  describe("signIn", () => {
    it("should call AuthService.signIn and return its result", async () => {
      const dto = { email: "x@x.com", password: "pwd" };
      const expected = { id: "2", email: dto.email, accessToken: "at2", refreshToken: "rt2" };
      mockAuthService.signIn.mockResolvedValueOnce(expected);

      await expect(controller.signIn(dto)).resolves.toEqual(expected);
      expect(mockAuthService.signIn).toHaveBeenCalledWith(dto.email, dto.password);
    });

    it("should propagate errors from AuthService.signIn", async () => {
      const dto = { email: "bad@b.com", password: "pwd" };
      mockAuthService.signIn.mockRejectedValueOnce(new Error("invalid"));

      await expect(controller.signIn(dto)).rejects.toThrow("invalid");
      expect(mockAuthService.signIn).toHaveBeenCalledWith(dto.email, dto.password);
    });
  });

  describe("refreshToken", () => {
    it("should call AuthService.refreshToken and return its result", async () => {
      const dto = { refreshToken: "rtoken" };
      const expected = { accessToken: "newAt", refreshToken: "newRt" };
      mockAuthService.refreshToken.mockResolvedValueOnce(expected);

      await expect(controller.refreshToken(dto)).resolves.toEqual(expected);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(dto);
    });

    it("should propagate errors from AuthService.refreshToken", async () => {
      const dto = { refreshToken: "bad" };
      mockAuthService.refreshToken.mockRejectedValueOnce(new Error("expired"));

      await expect(controller.refreshToken(dto)).rejects.toThrow("expired");
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(dto);
    });
  });
});
