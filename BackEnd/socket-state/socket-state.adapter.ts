import { INestApplicationContext, WebSocketAdapter } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NextFunction } from 'express';
import { Socket, ServerOptions, Server } from 'socket.io';

import { RedisPropagatorService } from '../redis-propagator/redis-propagator.service';
import { SocketStateService } from './socket-state.service';

interface TokenPayload {
  readonly userId: string;
  readonly quiz?: string;
}

export interface AuthenticatedSocket extends Socket {
  auth: TokenPayload;
}

export class SocketStateAdapter extends IoAdapter implements WebSocketAdapter {
  public constructor(
    private readonly app: INestApplicationContext,
    private readonly socketStateService: SocketStateService,
    private readonly redisPropagatorService: RedisPropagatorService,
  ) {
    super(app);
  }

  public create(port: number, options: ServerOptions = {}): Server {
    const server = super.createIOServer(port, options);
    this.redisPropagatorService.injectSocketServer(server);

    server.use(async (socket: AuthenticatedSocket, next: NextFunction) => {
      const token = socket.handshake.query?.token;
      const quiz = socket.handshake.query?.quiz;

      if (token === 'undefined') {
        return next('Invalid credential');
      }

      try {
        socket.auth = {
          userId: token,
          quiz,
        };

        return next();
      } catch (e) {
        return next(e);
      }
    });

    return server;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public bindClientConnect(server: Server, callback: Function): void {
    server.on('connection', (socket: AuthenticatedSocket) => {
      if (socket.auth) {
        this.socketStateService.add(socket.auth.userId, socket);

        socket.on('disconnect', () => {
          this.socketStateService.remove(socket.auth.userId, socket);
          socket.removeAllListeners('disconnect');
        });
      }

      callback(socket);
    });
  }
}
