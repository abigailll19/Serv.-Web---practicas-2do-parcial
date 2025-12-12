import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuarioModule } from './usuario/usuario.module';
import { ResenaModule } from './resena/resena.module';

@Module({
  imports: [
    UsuarioModule,
    ResenaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
