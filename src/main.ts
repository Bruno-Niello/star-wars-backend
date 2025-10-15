import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function main() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Conexa API")
    .setDescription("The Conexa Star Wars API description")
    .setVersion("1.0")
    .addTag("conexa")
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
main().catch(err => {
  console.error("Error starting server:", err);
  process.exit(1);
});
