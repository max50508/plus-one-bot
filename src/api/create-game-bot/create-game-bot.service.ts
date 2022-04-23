import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { client } from 'src/config/client';
import {
  CreateGame,
  CreateGameRepository,
} from 'src/entities/create-game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { GameMemberDto } from './dto/join-member.dto';

@Injectable()
export class CreateGameBotService {
  constructor(
    @InjectRepository(CreateGame)
    private readonly createGameRepository: CreateGameRepository,
  ) {}
  async getGame(groupId) {
    const game = await this.createGameRepository.findOne({
      where: { sourceId: groupId, isEnd: false },
    });

    return game;
  }

  async createGame(origin: CreateGameDto) {
    console.log(origin);
    const { replyToken, sourceId, sourceType } = origin;
    const isHave = await this.getGame(sourceId);
    console.log(28, isHave);
    if (isHave === undefined) {
      const game = await this.createGameRepository.create({
        member: [],
        sourceType: sourceType,
        sourceId: sourceId,
      });
      const haveGame = await this.createGameRepository.save(game);
      client.replyMessage(replyToken, {
        type: 'text',
        text: '球局已建立',
      });
    } else {
      client.replyMessage(replyToken, {
        type: 'text',
        text: '已經有球局了,你的球局ID:' + isHave.sourceId,
      });
    }
  }

  async joinMember(joinMember: GameMemberDto) {
    const game = await this.getGame(joinMember.sourceId);
    game.member.push(joinMember.userId);
    await this.createGameRepository.save(game);
    client.pushMessage(joinMember.sourceId, {
      type: 'text',
      text: '加入球局成功',
    });
  }
  async deleteMember(deleteMember: GameMemberDto) {
    const game = await this.getGame(deleteMember.sourceId);
    game.member.splice(game.member.indexOf(deleteMember.userId), 1);
    await this.createGameRepository.save(game);
    client.pushMessage(deleteMember.sourceId, {
      type: 'text',
      text: '退出球局成功',
    });
  }

  async memberList(sourceId, replyToken) {
    const list = (
      await this.createGameRepository.findOne({
        where: { sourceId: sourceId, isEnd: false },
        select: ['member'],
      })
    ).member;
    console.log(65, list);
    const newList: string[] = await Promise.all(
      list.map(async (value) => {
        return await client.getProfile(value).then((porfile) => {
          return porfile.displayName;
        });
      }),
    );
    console.log(70, newList);
    client.replyMessage(replyToken, {
      type: 'text',
      text: '球員名單\n' + newList.toString().replace(/,/gi, '\n'),
    });
  }

  async endGame(sourceId, replyToken) {
    const game = await this.getGame(sourceId);
    await this.memberList(sourceId, replyToken);
    // console.log(game);
    game.isEnd = true;
    await this.createGameRepository.save(game);
    client.pushMessage(game.sourceId, {
      type: 'text',
      text: '球局已結束',
    });
  }
}
