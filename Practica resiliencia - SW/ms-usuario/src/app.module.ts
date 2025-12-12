import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Usuario } from './usuario/usuario.entity';
import { UsuarioConsumer } from './usuario/usuario.consumer';
import { UsuarioService } from './usuario/usuario.service';
import { Idempotency } from './idempotency/idempotency.entity';
import { IdempotencyService } from './idempotency/idempotency.service';
import { IdempotencyGuard } from './idempotency/idempotency.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5435,
      username: 'pguser',
      password: 'pgpass',
      database: 'usuario_db',
      entities: [Usuario, Idempotency],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Usuario, Idempotency]),
  ],
  controllers: [AppController, UsuarioConsumer],
  providers: [AppService, UsuarioService, IdempotencyService, IdempotencyGuard],
})
export class AppModule {}
