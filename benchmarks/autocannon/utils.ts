// benchmarks/autocannon/utils.ts

export const BASE_URL =
    process.env.BASE_URL ?? "http://localhost:3000";

export const CONNECTIONS =
    Number(process.env.CONNECTIONS ?? 100);

export const DURATION =
    Number(process.env.DURATION ?? 30);