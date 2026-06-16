import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { EntrarDto } from './dto/entrar.dto';
import { RegistrarDto } from './dto/registrar.dto';
import { AtualizarTokenDto } from './dto/atualizar-token.dto';
import { Publico } from './decorators/publico.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Publico()
  @HttpCode(HttpStatus.OK)
  @Post('entrar')
  async entrar(@Body() dto: EntrarDto) {
    return this.authService.entrar(dto.email, dto.senha, dto.lembrarMe);
  }

  @Publico()
  @Post('registrar')
  async registrar(@Body() dto: RegistrarDto) {
    return this.authService.registrar(dto);
  }

  @Publico()
  @HttpCode(HttpStatus.OK)
  @Post('atualizar-token')
  async atualizarToken(@Body() dto: AtualizarTokenDto) {
    return this.authService.atualizarTokens(dto.tokenRefresh);
  }

  @Get('perfil')
  async obterPerfil(@Request() req: any) {
    return req.usuario;
  }
}
