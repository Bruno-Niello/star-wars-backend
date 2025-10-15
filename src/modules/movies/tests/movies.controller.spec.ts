import { Test, TestingModule } from "@nestjs/testing";
// Asumiendo que MoviesController está en un archivo "movies.controller" en el mismo nivel que el directorio de pruebas
// Nota: La ruta real puede variar (ej. ".. /src/movies/movies.controller")
import { MoviesController } from "../movies.controller";
import { MoviesService } from "../movies.service";
import { CreateMovieDto } from "../dto/create-movie.dto";
import { UpdateMovieDto } from "../dto/update-movie.dto";

jest.mock("../../auth/guards/auth.guard", () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));
jest.mock("../../auth/guards/roles.guard", () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe("MoviesController", () => {
  let controller: MoviesController;

  // MoviesService Mock
  const mockMoviesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    syncWithSwapi: jest.fn(),
  };

  beforeEach(async () => {
    // Configuración del módulo de pruebas
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      // Reemplazamos el MoviesService real con nuestro mock
      providers: [{ provide: MoviesService, useValue: mockMoviesService }],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
  });

  afterEach(() => {
    // Limpiamos los contadores de llamada y valores de retorno de todos los mocks después de cada test.
    jest.clearAllMocks();
  });

  // --- Test de Inicialización ---
  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // --- Pruebas de los Endpoints (Métodos) ---

  describe("create", () => {
    const dto: CreateMovieDto = {
      title: "Star Wars X - The New Test Jedi",
      director: "Bruno Niello",
      release_date: "2025-10-16",
      swapi_url: "https://swapi.dev/api/films/1/",
    };
    const created = { id: "1", ...dto };

    it("should call moviesService.create and return the created movie", async () => {
      // Arrange: Simular el valor de retorno del servicio
      mockMoviesService.create.mockResolvedValueOnce(created);

      // Act & Assert
      await expect(controller.create(dto)).resolves.toEqual(created);

      // Assert: Verificar que el servicio fue llamado con el DTO correcto
      expect(mockMoviesService.create).toHaveBeenCalledWith(dto);
      expect(mockMoviesService.create).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------------

  describe("findAll", () => {
    const list = [{ id: "1", title: "Star Wars XI" }];

    it("should call moviesService.findAll with defaults and return list", async () => {
      // Arrange
      mockMoviesService.findAll.mockResolvedValueOnce(list);

      // Act & Assert
      // Llamar sin argumentos (debería usar los valores por defecto del controlador)
      await expect(controller.findAll()).resolves.toEqual(list);

      // Assert: Verificar que el servicio fue llamado con los valores por defecto (title, ASC)
      expect(mockMoviesService.findAll).toHaveBeenCalledWith("title", "ASC");
      expect(mockMoviesService.findAll).toHaveBeenCalledTimes(1);
    });

    it("should pass query params through to service for custom sorting", async () => {
      // Arrange
      const customList = [{ id: "2", title: "Star Wars XII", release_date: "2000-01-01" }];
      mockMoviesService.findAll.mockResolvedValueOnce(customList);

      const orderBy = "release_date";
      const orderDir = "DESC";

      // Act & Assert: Probar con query parameters
      await expect(controller.findAll(orderBy, orderDir)).resolves.toEqual(customList);

      // Assert: Verificar que el servicio fue llamado con los parámetros de la query
      expect(mockMoviesService.findAll).toHaveBeenCalledWith(orderBy, orderDir);
      expect(mockMoviesService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------------

  describe("findOne", () => {
    const term = "uuid-1";
    const movie = { id: term, title: "A New Hope" };

    it("should call service.findOne with the term and return the movie", async () => {
      // Arrange
      mockMoviesService.findOne.mockResolvedValueOnce(movie);

      // Act & Assert
      await expect(controller.findOne(term)).resolves.toEqual(movie);

      // Assert
      expect(mockMoviesService.findOne).toHaveBeenCalledWith(term);
      expect(mockMoviesService.findOne).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------------

  describe("update", () => {
    const id = "uuid-1";
    const dto: UpdateMovieDto = { title: "Updated Title" } as UpdateMovieDto;
    const updated = { id, title: dto.title };

    it("should call service.update and return the updated movie", async () => {
      // Arrange
      mockMoviesService.update.mockResolvedValueOnce(updated);

      // Act & Assert
      await expect(controller.update(id, dto)).resolves.toEqual(updated);

      // Assert
      expect(mockMoviesService.update).toHaveBeenCalledWith(id, dto);
      expect(mockMoviesService.update).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------------

  describe("remove", () => {
    const id = "uuid-1";
    const removeResult = { message: `Movie with ID ${id} removed successfully` };

    it("should call service.remove and return the success message", async () => {
      // Arrange
      mockMoviesService.remove.mockResolvedValueOnce(removeResult);

      // Act & Assert
      await expect(controller.remove(id)).resolves.toEqual(removeResult);

      // Assert
      expect(mockMoviesService.remove).toHaveBeenCalledWith(id);
      expect(mockMoviesService.remove).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------------------

  describe("syncWithSwapi", () => {
    it("should call service.syncWithSwapi and return the result", async () => {
      // Arrange
      const syncResult = { count: 6, results: [{ title: "A New Hope", status: "created" }] };
      mockMoviesService.syncWithSwapi.mockResolvedValueOnce(syncResult);

      // Act & Assert
      await expect(controller.syncWithSwapi()).resolves.toEqual(syncResult);

      // Assert
      expect(mockMoviesService.syncWithSwapi).toHaveBeenCalled();
      expect(mockMoviesService.syncWithSwapi).toHaveBeenCalledTimes(1);
    });
  });
});
