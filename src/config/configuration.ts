export interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || "3000", 10),
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME || "conexa_db",
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "password",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "defaultSecret",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
});

export const CONFIG_KEYS = {
  PORT: "port",
  DATABASE: {
    HOST: "database.host",
    PORT: "database.port",
    NAME: "database.name",
    USERNAME: "database.username",
    PASSWORD: "database.password",
  },
  JWT: {
    SECRET: "jwt.secret",
    EXPIRES_IN: "jwt.expiresIn",
  },
} as const;
