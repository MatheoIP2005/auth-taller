import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para el frontend
  app.enableCors({
    origin: 'http://localhost:5173',  // URL del frontend (Vite)
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();