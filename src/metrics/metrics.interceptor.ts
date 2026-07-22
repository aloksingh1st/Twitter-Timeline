import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";

import { MetricsService } from "./metrics.service";
import { getRouteLabel } from "src/utils/route.helper";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(
        private readonly metrics: MetricsService,
    ) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<any> {
        const http = context.switchToHttp();

        const req = http.getRequest();
        const res = http.getResponse();

        const method = req.method;
        const route = getRouteLabel(req);

        this.metrics.httpRequestsInFlight.inc();

        const endTimer =
            this.metrics.httpRequestDuration.startTimer();

        return next.handle().pipe(
            finalize(() => {
                const status = res.statusCode.toString();

                const labels = {
                    method,
                    route,
                    status,
                };

                this.metrics.httpRequestsTotal.inc(labels);
                endTimer(labels);
                this.metrics.httpRequestsInFlight.dec();
            }),
        );
    }
}