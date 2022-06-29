import { Test, TestingModule } from '@nestjs/testing';
import { ReportGateway } from './report.gateway';

describe('ProjectGateway', () => {
  let gateway: ReportGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportGateway],
    }).compile();

    gateway = module.get<ReportGateway>(ReportGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
