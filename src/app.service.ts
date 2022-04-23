import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// import client from './config/client';
import {
  CreateGame,
  CreateGameRepository,
} from './entities/create-game.entity';
import { SourceType } from './enum/source-type';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello nestjs!';
  }
}
