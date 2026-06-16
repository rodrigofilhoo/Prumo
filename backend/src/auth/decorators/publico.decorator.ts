import { SetMetadata } from '@nestjs/common';
import { CHAVE_PUBLICA } from '../constants';

export const Publico = () => SetMetadata(CHAVE_PUBLICA, true);
