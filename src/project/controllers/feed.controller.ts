import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { FeedRequestDto } from '../dto/request/feed.dto';
import { SearchRequestDto } from '../dto/request/search.dto';
import { FeedService } from '../services/feed.service';

@Controller('project/feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getFeed(@Query() query: FeedRequestDto) {
    return this.feedService.getFeed(query);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Query() query: SearchRequestDto) {
    return this.feedService.search(query);
  }

  @Get('pending')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getPendingProjects(@Query() query: Omit<FeedRequestDto, 'order'>) {
    return this.feedService.getPendingProjects(query);
  }
}
