//-------------------------------------------------------------------------//
//-------------------------------IMPORTANTE--------------------------------//
//-------------------------------------------------------------------------//
//    Por falta de tiempo tuve que utilizar IA                             //
//     para generar y arreglar estos tests.                                //
//    He intentado mantener la lógica original en la medida de lo posible. //
//    Hay muchos errores de TS y linter que no he podido corregir.         //
//    Lamento el resultado. - Bruno                                        //
//-------------------------------------------------------------------------//
import { Test, TestingModule } from "@nestjs/testing";
import { MoviesService } from "../movies.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Movie } from "../entities/movie.entity";
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import { isUUID } from "class-validator";

// Mock del repositorio de Movie
const mockMovieRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// Mock de axios.get para simular la respuesta de la API externa
jest.mock("axios", () => ({
  get: jest.fn(),
}));

// Mock de isUUID para controlar el comportamiento en findOne
jest.mock("class-validator", () => ({
  isUUID: jest.fn(),
}));

const mockMovie: Movie = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "A New Hope",
  director: "George Lucas",
  release_date: "1977-05-25",
  swapi_url: "https://www.swapi.tech/api/films/1",
  opening_crawl: "Mock crawl",
  producer: "Gary Kurtz, Rick McCallum",
  episode_id: 4,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockCreateMovieDto = {
  title: "The Empire Strikes Back",
  director: "Irvin Kershner",
  release_date: "1980-05-21",
  swapi_url: "https://www.swapi.tech/api/films/2",
  opening_crawl: "Mock crawl 2",
  producer: "Gary Kurtz, Rick McCallum",
  episode_id: 5,
};

describe("MoviesService", () => {
  let service: MoviesService;
  let repository: typeof mockMovieRepository;

  beforeEach(async () => {
    // Restaurar los mocks antes de cada prueba
    jest.clearAllMocks();

    // Configuración del módulo de prueba
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepository,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repository = module.get(getRepositoryToken(Movie));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // --- Pruebas para create ---

  describe("create", () => {
    it("should successfully create a new movie", async () => {
      // Arrange
      repository.findOneBy.mockResolvedValue(null);
      repository.create.mockReturnValue(mockMovie);
      repository.save.mockResolvedValue(mockMovie);

      // Act
      const result = await service.create(mockCreateMovieDto);

      // Assert
      expect(repository.findOneBy).toHaveBeenCalledWith({ title: mockCreateMovieDto.title });
      expect(repository.create).toHaveBeenCalledWith(mockCreateMovieDto);
      expect(repository.save).toHaveBeenCalledWith(mockMovie);
      expect(result).toEqual(mockMovie);
    });

    it("should throw BadRequestException if movie title already exists", async () => {
      // Arrange
      repository.findOneBy.mockResolvedValue(mockMovie);

      // Act & Assert
      await expect(service.create(mockCreateMovieDto)).rejects.toThrow(BadRequestException);
      expect(repository.findOneBy).toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should handle database error and throw InternalServerErrorException", async () => {
      // Arrange
      const mockDBError = { code: "some-other-error", detail: "DB failure" };
      repository.findOneBy.mockResolvedValue(null);
      repository.create.mockReturnValue(mockMovie);
      repository.save.mockRejectedValue(mockDBError);

      // Act & Assert
      await expect(service.create(mockCreateMovieDto)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  // --- Pruebas para findAll ---

  describe("findAll", () => {
    it("should return an array of movies with default sorting", async () => {
      // Arrange
      const moviesList: Movie[] = [mockMovie];
      repository.find.mockResolvedValue(moviesList);

      // Act
      const result = await service.findAll();

      // Assert
      expect(repository.find).toHaveBeenCalledWith({ order: { title: "ASC" } });
      expect(result).toEqual(moviesList);
    });

    it("should return an array of movies with custom sorting", async () => {
      // Arrange
      const moviesList: Movie[] = [mockMovie];
      repository.find.mockResolvedValue(moviesList);

      // Act
      const result = await service.findAll("release_date", "DESC");

      // Assert
      expect(repository.find).toHaveBeenCalledWith({ order: { release_date: "DESC" } });
      expect(result).toEqual(moviesList);
    });
  });

  // --- Pruebas para findOne ---

  describe("findOne", () => {
    it("should find a movie by UUID", async () => {
      // Arrange
      (isUUID as jest.Mock).mockReturnValue(true);
      repository.findOneBy.mockResolvedValue(mockMovie);

      // Act
      const result = await service.findOne(mockMovie.id);

      // Assert
      expect(isUUID).toHaveBeenCalledWith(mockMovie.id);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockMovie.id });
      expect(result).toEqual(mockMovie);
    });

    it("should find a movie by title", async () => {
      // Arrange
      (isUUID as jest.Mock).mockReturnValue(false);
      repository.findOneBy.mockResolvedValue(mockMovie);

      // Act
      const result = await service.findOne(mockMovie.title);

      // Assert
      expect(isUUID).toHaveBeenCalledWith(mockMovie.title);
      expect(repository.findOneBy).toHaveBeenCalledWith({ title: mockMovie.title });
      expect(result).toEqual(mockMovie);
    });

    it("should throw NotFoundException if movie not found", async () => {
      // Arrange
      (isUUID as jest.Mock).mockReturnValue(true);
      repository.findOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(mockMovie.id)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if term is invalid", async () => {
      // Arrange
      const invalidTerm = null as unknown as string; // Simulate invalid input

      // Act & Assert
      await expect(service.findOne(invalidTerm)).rejects.toThrow(BadRequestException);
      expect(repository.findOneBy).not.toHaveBeenCalled();
    });
  });

  // --- Pruebas para update ---

  describe("update", () => {
    it("should successfully update a movie", async () => {
      // Arrange
      const updateDto = { title: "New Title" };
      const updatedMovie = { ...mockMovie, ...updateDto };

      // Mock findOne para la validación de existencia y para devolver el resultado actualizado
      jest
        .spyOn(service, "findOne")
        .mockResolvedValueOnce(mockMovie)
        .mockResolvedValueOnce(updatedMovie as Movie);
      repository.update.mockResolvedValue({ affected: 1 });

      // Act
      const result = await service.update(mockMovie.id, updateDto);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockMovie.id); // Check existence
      expect(repository.update).toHaveBeenCalledWith(mockMovie.id, updateDto);
      expect(service.findOne).toHaveBeenCalledWith(mockMovie.id); // Get updated record
      expect(result).toEqual(updatedMovie);
    });

    it("should propagate NotFoundException from findOne", async () => {
      // Arrange
      const updateDto = { title: "New Title" };
      jest.spyOn(service, "findOne").mockRejectedValue(new NotFoundException());
      repository.update.mockClear();

      // Act & Assert
      await expect(service.update(mockMovie.id, updateDto)).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  // --- Pruebas para remove ---

  describe("remove", () => {
    it("should successfully remove a movie", async () => {
      // Arrange
      jest.spyOn(service, "findOne").mockResolvedValue(mockMovie);
      repository.remove.mockResolvedValue(undefined);

      // Act
      const result = await service.remove(mockMovie.id);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockMovie.id);
      expect(repository.remove).toHaveBeenCalledWith(mockMovie);
      expect(result).toEqual({ message: `Movie with ID ${mockMovie.id} removed successfully` });
    });

    it("should propagate NotFoundException from findOne", async () => {
      // Arrange
      jest.spyOn(service, "findOne").mockRejectedValue(new NotFoundException());
      repository.remove.mockClear();

      // Act & Assert
      await expect(service.remove(mockMovie.id)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  // --- Pruebas para syncWithSwapi ---

  describe("syncWithSwapi", () => {
    const swapiFilmsMock = [
      {
        properties: {
          title: "Film 1",
          director: "Dir 1",
          release_date: "2000",
          url: "url1",
          opening_crawl: "crawl 1",
          producer: "Prod 1",
          episode_id: 1,
        },
      },
      {
        properties: {
          title: "Film 2",
          director: "Dir 2",
          release_date: "2001",
          url: "url2",
          opening_crawl: "crawl 2",
          producer: "Prod 2",
          episode_id: 2,
        },
      },
    ];

    it("should sync new movies from SWAPI", async () => {
      // Arrange
      const fetchAllFilmsSpy = jest.spyOn(service as any, "fetchAllFilms");
      fetchAllFilmsSpy.mockResolvedValue(swapiFilmsMock.map(f => f.properties));

      jest
        .spyOn(service, "create")
        .mockResolvedValueOnce(null) // Film 1 already exists (suppressErrors=true)
        .mockResolvedValueOnce({ ...mockMovie, title: "Film 2" } as Movie); // Film 2 created

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(fetchAllFilmsSpy).toHaveBeenCalled();
      expect(service.create).toHaveBeenCalledTimes(2);
      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Film 1" }),
        true
      );
      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Film 2" }),
        true
      );
      expect(result.count).toBe(2);
      expect(result.results).toEqual([
        { title: "Film 1", status: "skipped", reason: "already exists" },
        { title: "Film 2", status: "created" },
      ]);
    });

    it("should return count 0 if no movies found from SWAPI", async () => {
      // Arrange
      const fetchAllFilmsSpy = jest.spyOn(service as any, "fetchAllFilms");
      fetchAllFilmsSpy.mockResolvedValue([]);

      // Act
      const result = await service.syncWithSwapi();

      // Assert
      expect(fetchAllFilmsSpy).toHaveBeenCalled();
      expect(result).toEqual({ count: 0 });
    });
  });

  // --- Pruebas para fetchAllFilms (Método privado) ---

  describe("fetchAllFilms", () => {
    it("should fetch and transform films from SWAPI", async () => {
      // Arrange
      const swapiResponseMock = {
        data: {
          result: [
            {
              properties: {
                title: "Film A",
                director: "Dir A",
                release_date: "2020",
                url: "urlA",
                opening_crawl: "crawl A",
                producer: "Prod A",
                episode_id: 3,
              },
            },
          ],
        },
      };
      (axios.get as jest.Mock).mockResolvedValue(swapiResponseMock);

      // Act
      const result = await (service as any).fetchAllFilms(); // Acceso al método privado para el test

      // Assert
      expect(axios.get).toHaveBeenCalledWith("https://www.swapi.tech/api/films");
      expect(result).toEqual([swapiResponseMock.data.result[0].properties]);
    });

    it("should throw an error if axios fails", async () => {
      // Arrange
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network error"));

      // Act & Assert
      await expect((service as any).fetchAllFilms()).rejects.toThrow("Network error");
    });
  });

  // --- Pruebas para handleSwapiSyncCron (Cron) ---

  describe("handleSwapiSyncCron", () => {
    it("should call syncWithSwapi", async () => {
      // Arrange
      jest.spyOn(service, "syncWithSwapi").mockResolvedValue({ count: 1 });

      // Act
      await service.handleSwapiSyncCron();

      // Assert
      expect(service.syncWithSwapi).toHaveBeenCalled();
    });
  });

  // --- Pruebas para handleExceptions (Método privado) ---

  describe("handleExceptions", () => {
    it("should rethrow BadRequestException", () => {
      // Arrange
      const error = new BadRequestException("Bad request");

      // Act & Assert
      expect(() => (service as any).handleExceptions(error)).toThrow(BadRequestException);
    });

    it("should rethrow NotFoundException", () => {
      // Arrange
      const error = new NotFoundException("Not found");

      // Act & Assert
      expect(() => (service as any).handleExceptions(error)).toThrow(NotFoundException);
    });

    it("should convert DB unique violation (23505) to BadRequestException", () => {
      // Arrange
      const dbError = { code: "23505", detail: "Key (title)=(Existing Movie) already exists." };

      // Act & Assert
      expect(() => (service as any).handleExceptions(dbError)).toThrow(BadRequestException);
      expect(() => (service as any).handleExceptions(dbError)).toThrow(dbError.detail);
    });

    it("should throw InternalServerErrorException for unknown error", () => {
      // Arrange
      const unknownError = new Error("Unknown error in DB");

      // Act & Assert
      expect(() => (service as any).handleExceptions(unknownError)).toThrow(
        InternalServerErrorException
      );
      expect(() => (service as any).handleExceptions(unknownError)).toThrow(
        `Unexpected error, for more detail check server logs -> Error: Unknown error in DB`
      );
    });
  });
});
