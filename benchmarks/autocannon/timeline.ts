// benchmarks/autocannon/timeline.ts

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
    const user = await prisma.user.findFirst({
        where: {
            following: {
                some: {},
            },
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        throw new Error(
            "No suitable user found. Seed the database first.",
        );
    }

    console.log(`Benchmarking user: ${user.id}\n`);

    const instance = autocannon({
        url: `${BASE_URL}/timeline/${user.id}`,
        connections: CONNECTIONS,
        duration: DURATION,
        pipelining: 1,
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
        benchmark: "timeline",
        timestamp: new Date().toISOString(),
        config: {
            url: `${BASE_URL}/timeline/${user.id}`,
            connections: CONNECTIONS,
            duration: DURATION,
            pipelining: 1,
        },
        result,
    };

    const file = path.join(
        resultsDir,
        `timeline-${timestamp}.json`,
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