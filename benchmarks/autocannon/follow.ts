import autocannon from "autocannon";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

import {
    BASE_URL,
    CONNECTIONS,
    DURATION,
} from "./utils";

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        take: 2,
        select: {
            id: true,
        },
    });

    if (users.length < 2) {
        throw new Error("Need at least two users.");
    }

    const followerId = users[0].id;
    const followeeId = users[1].id;

    await prisma.follow.deleteMany({
        where: {
            followerId,
            followeeId,
        },
    });

    console.log(
        `Benchmarking follow: ${followerId} -> ${followeeId}\n`,
    );

    const instance = autocannon({
        url: `${BASE_URL}/follows`,
        method: "POST",
        connections: CONNECTIONS,
        duration: DURATION,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            followerId,
            followeeId,
        }),
    });

    autocannon.track(instance, {
        renderProgressBar: true,
        renderLatencyTable: true,
    });

    const result = await new Promise<autocannon.Result>((resolve, reject) => {
        instance.on("done", resolve);
        instance.on("error", reject);
    });

    const resultsDir = path.join(
        process.cwd(),
        "benchmarks",
        "results",
    );

    await fs.mkdir(resultsDir, {
        recursive: true,
    });

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

    const output = {
        benchmark: "follow-user",
        timestamp: new Date().toISOString(),
        config: {
            url: `${BASE_URL}/follows`,
            connections: CONNECTIONS,
            duration: DURATION,
        },
        result,
    };

    const file = path.join(
        resultsDir,
        `follow-user-${timestamp}.json`,
    );

    await fs.writeFile(
        file,
        JSON.stringify(output, null, 2),
    );

    console.log(`\nBenchmark saved to:\n${file}`);

    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
});