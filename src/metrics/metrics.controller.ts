import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
  constructor(
    private readonly metrics: MetricsService,
  ) {}

  @Get('metrics')
  async metricsEndpoint(@Res() res: Response) {
    res.setHeader(
      'Content-Type',
      this.metrics.registry.contentType,
    );

    res.send(await this.metrics.metrics());
  }
}