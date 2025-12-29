import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://172.16.178.144:3000',
      'http://172.16.178.144:3001',
      'http://172.16.178.119:3000'
    ],
    credentials: true,
  });
  app.use((req: any, res: any, next: any) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();
