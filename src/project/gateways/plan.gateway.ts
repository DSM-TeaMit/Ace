import { UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { CreatePlanRequestDto } from '../dto/request/create-plan.dto';
import { PlanService } from '../services/plan.service';
import { ProjectService } from '../services/project.service';

@WebSocketGateway()
@UsePipes(
  new ValidationPipe({
    exceptionFactory: (errors) => new WsException(errors),
  }),
)
export class PlanGateway {
  constructor(
    private readonly jwtService: JwtService,
    private readonly planService: PlanService,
    private readonly projectRepository: ProjectRepository,
    private readonly projectService: ProjectService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      if (
        !client.handshake.headers.authorization ||
        !client.handshake.query.uuid
      )
        client.disconnect();
      const payload = this.jwtService.verify(
        client.handshake.headers.authorization,
      );
      const project = await this.projectRepository.findOne({
        uuid: client.handshake.query.uuid as string,
      });
      if (!project) client.disconnect();
      this.projectService.checkPermission(project, payload.sub);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('PLAN_UPDATE')
  handleMessage(
    @MessageBody() payload: CreatePlanRequestDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    return this.planService.createOrModifyPlan(
      { uuid: client.handshake.query.uuid as string },
      payload,
    );
  }
}
