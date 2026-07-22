import { Request } from "express";

export function getRouteLabel(req: Request): string {
    const baseUrl = req.baseUrl ?? "";
    const routePath = req.route?.path;

    if (routePath) {
        return `${baseUrl}${routePath}`;
    }

    return req.path;
}