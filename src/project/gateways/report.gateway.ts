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
import { CreateReportRequestDto } from '../dto/request/create-report.dto';
import { ProjectService } from '../services/project.service';
import { ReportService } from '../services/report.service';

@WebSocketGateway()
@UsePipes(
  new ValidationPipe({
    exceptionFactory: (errors) => new WsException(errors),
  }),
)
export class ReportGateway {
  constructor(
    private readonly jwtService: JwtService,
    private readonly projectRepository: ProjectRepository,
    private readonly projectService: ProjectService,
    private readonly reportService: ReportService,
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

  @SubscribeMessage('REPORT_UPDATE')
  async handleMessage(
    @MessageBody() payload: CreateReportRequestDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    return this.reportService.createOrModifyReport(
      { uuid: client.handshake.query.uuid as string },
      payload,
    );
  }
}
