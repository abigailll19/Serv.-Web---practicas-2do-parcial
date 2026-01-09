import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario/usuario.entity';
import { UsuarioConsumer } from './usuario/usuario.consumer';
import { UsuarioService } from './usuario/usuario.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5434,
      username: 'pguser',
      password: 'pgpass',
      database: 'usuario_db',
      entities: [Usuario],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Usuario]),
  ],
  controllers: [AppController, UsuarioConsumer],
  providers: [AppService, UsuarioService],
})
export class AppModule {}
