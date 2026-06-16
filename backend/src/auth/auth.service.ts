import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../usuarios/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async entrar(email: string, senha: string, lembrarMe: boolean = false) {
    const usuario = await this.usersService.buscarPorEmail(email);

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!usuario.ativo) {
      throw new UnauthorizedException('Usuário desativado');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.gerarTokens(
      usuario.id,
      usuario.email,
      lembrarMe,
    );

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        grupo: usuario.grupo,
      },
      ...tokens,
    };
  }

  async registrar(dados: {
    nome: string;
    email: string;
    senha: string;
    telefone: string;
    nascimento: string;
    grupoId: number;
  }) {
    const usuarioExistente = await this.usersService.buscarPorEmail(
      dados.email,
    );

    if (usuarioExistente) {
      throw new ConflictException('Email já em uso');
    }

    const usuario = await this.usersService.criar({
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      telefone: dados.telefone,
      nascimento: new Date(dados.nascimento),
      grupoId: dados.grupoId,
    });

    return usuario;
  }

  async atualizarTokens(tokenRefresh: string) {
    try {
      const payload = await this.jwtService.verifyAsync(tokenRefresh, {
        secret: this.configService.get<string>('JWT_REFRESH_SEGREDO'),
      });

      const usuario = await this.usersService.buscarPorId(payload.sub);

      if (!usuario || !usuario.ativo) {
        throw new UnauthorizedException('Usuário não encontrado ou desativado');
      }

      const lembrarMe = payload.lembrarMe === true;
      const tokens = await this.gerarTokens(
        usuario.id,
        usuario.email,
        lembrarMe,
      );

      return tokens;
    } catch (erro) {
      if (erro instanceof UnauthorizedException) {
        throw erro;
      }
      throw new UnauthorizedException(
        'Token de atualização inválido ou expirado',
      );
    }
  }

  private async gerarTokens(
    idUsuario: number,
    email: string,
    lembrarMe: boolean,
  ) {
    const payloadAcesso = {
      sub: idUsuario,
      email,
    };

    const payloadRefresh = {
      sub: idUsuario,
      email,
      lembrarMe,
    };

    const segredoAcesso = this.configService.get<string>('JWT_SEGREDO')!;
    const segredoRefresh =
      this.configService.get<string>('JWT_REFRESH_SEGREDO')!;

    const opcoesAcesso: JwtSignOptions = {
      secret: segredoAcesso,
    };

    const opcoesRefresh: JwtSignOptions = {
      secret: segredoRefresh,
    };

    if (!lembrarMe) {
      const expiracaoAcesso =
        this.configService.get<string>('JWT_EXPIRACAO') ?? '1d';
      const expiracaoRefresh =
        this.configService.get<string>('JWT_REFRESH_EXPIRACAO') ?? '7d';

      opcoesAcesso.expiresIn = expiracaoAcesso as any;
      opcoesRefresh.expiresIn = expiracaoRefresh as any;
    }

    const [tokenAcesso, tokenRefresh] = await Promise.all([
      this.jwtService.signAsync(payloadAcesso, opcoesAcesso),
      this.jwtService.signAsync(payloadRefresh, opcoesRefresh),
    ]);

    return {
      tokenAcesso,
      tokenRefresh,
    };
  }
}
