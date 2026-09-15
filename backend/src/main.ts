import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // Body parsing is set up manually below so the Stripe webhook route can get
  // the raw request bytes (required for signature verification) while every
  // other route keeps the usual JSON body parsing.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableCors({
    origin: true, // Allow all origins temporarily for debugging
    credentials: true,
  });

  // No ValidationPipe existed anywhere before this — every @IsEmail()/
  // @IsNotEmpty() etc. decorator on every DTO (RegisterDto included) was
  // silently inert, and untyped `@Body() x: any` handlers had zero
  // protection against malformed input, which is how an Invalid Date
  // reached Postgres directly and crashed with a raw 500. This only
  // activates validation for routes that declare a typed, decorated DTO
  // (not a behavior change for routes still typed `any`), so it's a
  // strictly additive fix, not a new restriction on existing behavior.
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.originalUrl === '/payments/webhook') {
      express.raw({ type: 'application/json' })(req, res, next);
    } else {
      express.json()(req, res, next);
    }
  });
  app.use(express.urlencoded({ extended: true }));

  app.use((req: any, res: any, next: any) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Backend is listening on http://0.0.0.0:${port}`);
}
bootstrap().catch(err => {
  console.error('❌ Failed to start backend:', err);
  process.exit(1);
});
