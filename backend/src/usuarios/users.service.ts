import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: {
        grupo: {
          include: { permissoes: true },
        },
      },
    });
  }

  async buscarPorId(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      include: {
        grupo: {
          include: { permissoes: true },
        },
      },
    });
  }

  async criar(dados: {
    nome: string;
    email: string;
    senha: string;
    telefone: string;
    nascimento: Date;
    grupoId: number;
  }) {
    const saltos = 10;
    const senhaHash = await bcrypt.hash(dados.senha, saltos);

    return this.prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha_hash: senhaHash,
        telefone: dados.telefone,
        nascimento: dados.nascimento,
        grupoId: dados.grupoId,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        nascimento: true,
        grupoId: true,
        ativo: true,
        dataCriacao: true,
      },
    });
  }
}
