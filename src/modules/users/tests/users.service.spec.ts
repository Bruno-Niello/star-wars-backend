import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UsersService } from "../users.service";
import { User } from "../entities/user.entity";
import { Repository, ObjectLiteral } from "typeorm";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";

type MockRepo<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  create?: jest.Mock;
  save?: jest.Mock;
  find?: jest.Mock;
  findOne?: jest.Mock;
  findOneBy?: jest.Mock;
  delete?: jest.Mock;
};

const createMockRepo = <T extends ObjectLiteral = any>(): MockRepo<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  delete: jest.fn(),
});

describe("UsersService", () => {
  let service: UsersService;
  let repo: MockRepo<User>;

  beforeEach(async () => {
    repo = createMockRepo<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("lanza ConflictException si el email ya existe", async () => {
      (repo.findOne as jest.Mock).mockResolvedValueOnce({ id: "1", email: "ex@e.com" });

      await expect(
        service.create({ email: "ex@e.com", password: "p", name: "mefe" } as CreateUserDto)
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("crea y guarda un usuario cuando no existe", async () => {
      (repo.findOne as jest.Mock).mockResolvedValueOnce(null);
      const dto: CreateUserDto = {
        email: "n@e.com",
        name: "N",
        password: "p",
      };
      const created = { id: "10", ...dto };
      repo.create!.mockReturnValueOnce(created);
      repo.save!.mockResolvedValueOnce(created);

      const res = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(res).toEqual(created);
    });
  });

  describe("findAll", () => {
    it("devuelve la lista desde repo.find", async () => {
      const list = [{ id: "1", email: "a@a.com" }];
      repo.find!.mockResolvedValueOnce(list);

      const res = await service.findAll();

      expect(repo.find).toHaveBeenCalled();
      expect(res).toEqual(list);
    });
  });

  describe("findOne", () => {
    it("devuelve usuario cuando existe", async () => {
      repo.findOneBy!.mockResolvedValueOnce({ id: "u1", email: "a@a.com" });

      const res = await service.findOne("u1");

      expect(res).toBeDefined();
      expect(repo.findOneBy).toHaveBeenCalledWith(expect.any(Object));
    });

    it("lanza NotFoundException cuando no existe", async () => {
      repo.findOneBy!.mockResolvedValueOnce(null);

      await expect(service.findOne("missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("update", () => {
    it("actualiza el usuario si existe", async () => {
      const existing = { id: "u1", email: "a@a.com" };
      (repo.findOneBy as jest.Mock).mockResolvedValueOnce(existing);
      const merged = { ...existing, name: "Updated" };
      repo.save!.mockResolvedValueOnce(merged);

      const updateDto: UpdateUserDto = { name: "Updated" };
      const res = await service.update("u1", updateDto);

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: "u1" } as any);
      expect(repo.save).toHaveBeenCalledWith(merged);
      expect(res).toEqual(merged);
    });

    it("lanza NotFoundException si no existe para actualizar", async () => {
      (repo.findOneBy as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.update("no-id", { name: "X" })).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  describe("remove", () => {
    it("borra usuario y devuelve resultado", async () => {
      repo.delete!.mockResolvedValueOnce({ affected: 1 });

      const res = await service.remove("id-1");

      expect(repo.delete).toHaveBeenCalledWith("id-1");
      expect(res).toEqual({ affected: 1 });
    });
  });

  describe("createAdmin", () => {
    it("lanza NotFoundException si no existe el usuario", async () => {
      repo.findOne!.mockResolvedValueOnce(null);

      await expect(service.createAdmin("no@e.com")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("marca al usuario como admin y guarda (roles array)", async () => {
      const user: User = {
        id: "u1",
        email: "a@a.com",
        password: "mockPassword",
        name: "Mock Name",
        role: "user",
        created_at: new Date(),
        updated_at: new Date(),
      };
      repo.findOne!.mockResolvedValueOnce(user);
      repo.save!.mockResolvedValueOnce({ ...user, roles: ["USER", "admin"] });

      const res = await service.createAdmin("a@a.com");

      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: "a@a.com" } });
      expect(repo.save).toHaveBeenCalled();
      expect(res).toEqual({ message: "User with email a@a.com has been promoted to admin." });
    });
  });
});
