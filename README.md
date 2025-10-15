<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  </a>
</p>

# CONEXA API

API RESTful desarrollada con [NestJS](https://nestjs.com/) para la gestión de usuarios y películas, incluyendo autenticación JWT, roles y sincronización con SWAPI.

---

## Tabla de Contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Comandos útiles](#comandos-útiles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Notas](#notas)

---

## Características

- **Autenticación JWT**: Registro, login y refresh token.
- **Roles y permisos**: Protección de rutas por roles (`admin`, `user`).
- **Gestión de usuarios**: CRUD de usuarios y asignación de roles.
- **Gestión de películas**: CRUD de películas y sincronización con [SWAPI](https://swapi.dev/).
- **Pruebas unitarias**: Cobertura de servicios, controladores y guards.
- **Docker**: Base de datos lista para desarrollo local.

---

## Requisitos

- Node.js >= 22.x
- npm >= 9.x
- Docker y Docker Compose (para la base de datos)
- Git

---

## Instalación

1. **Clonar el repositorio**
```bash
   git clone https://github.com/tu-usuario/nest-conexa.git
   cd nest-conexa
```

2. **Instalar dependencias**
```bash
  npm install
```

3. **Renombrar el archivo ```.env.example``` a ```.env```**
```bash
   mv .env.example .env
```

4. **Levantar la base de datos**
```bash
  docker-compose up -d 
```

> **Nota:** Si usas DBeaver y ves el error  
> `Invalid value for parameter "TimeZone": "America/Buenos_Aires"`  
> cambia el valor de la zona horaria o usa otra herramienta.

5. **Iniciar el modo desarrollo**
```bash
   npm run start:dev
```

---

## Testing

Por falta de tiempo los testing automatizados no lograron un coverage del 100%. Para el testing se utilizo Jest y para agilizar tareas y mockeos se utilizo Gemini (IA-Google). 

|------------------------------|---------|----------|---------|---------|
| File                         | % Stmts | % Branch | % Funcs | % Lines |
|------------------------------|---------|----------|---------|---------|
| All files                    |   78.02 |    66.81 |    87.5 |   79.05 |
|------------------------------|---------|----------|---------|---------|

---

## Estructura del proyecto

```plaintext
src/
  app.module.ts
  main.ts
  modules/
    auth/      # Autenticación y autorización
    movies/    # Gestión de películas
    users/     # Gestión de usuarios
  common/      # Excepciones y utilidades
```

---

## Comandos útiles

| Comando                  | Descripción                                 |
|--------------------------|---------------------------------------------|
| `npm run start:dev`      | Inicia el servidor en modo desarrollo       |
| `npm run test`           | Ejecuta todos los tests unitarios           |
| `npm run test:cov`       | Muestra el reporte de cobertura de tests    |
| `docker-compose up -d`   | Levanta la base de datos en Docker          |
| `docker-compose down`    | Detiene y elimina los contenedores de Docker|

---

## Notas

- El proyecto utiliza **TypeORM** y una base de datos **PostgreSQL** por defecto.
- Puedes modificar la configuración de la base de datos en el archivo `.env`.
- Si tienes problemas con dependencias de guards en los tests, asegúrate de **mockearlos correctamente**.
