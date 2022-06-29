import { Test, TestingModule } from '@nestjs/testing';
import { PlanGateway } from './plan.gateway';

describe('PlanGateway', () => {
  let gateway: PlanGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanGateway],
    }).compile();

    gateway = module.get<PlanGateway>(PlanGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
