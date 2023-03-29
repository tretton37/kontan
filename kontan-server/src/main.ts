import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  await app.listen(process.env.NODE_ENV === 'production' ? 3000 : 8080);
}
bootstrap();
