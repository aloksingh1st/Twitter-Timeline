import { faker } from '@faker-js/faker';

export function randomInt(min: number, max: number): number {
    return faker.number.int({ min, max });
}

export function randomDate(days = 90): Date {
    const now = Date.now();
    const past = now - days * 24 * 60 * 60 * 1000;

    return new Date(randomInt(past, now));
}

export function chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }

    return chunks;
}