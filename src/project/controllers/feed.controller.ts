import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
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
}
