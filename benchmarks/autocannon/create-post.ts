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
        select: {
            id: true,
        },
    });

    if (!user) {
        throw new Error("No users found. Run seed first.");
    }

    console.log(`Benchmarking create post for user: ${user.id}\n`);

    const instance = autocannon({
        url: `${BASE_URL}/posts`,
        method: "POST",
        connections: CONNECTIONS,
        duration: DURATION,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            authorId: user.id,
            content: "Autocannon benchmark post",
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
        benchmark: "create-post",
        timestamp: new Date().toISOString(),
        config: {
            url: `${BASE_URL}/posts`,
            connections: CONNECTIONS,
            duration: DURATION,
        },
        result,
    };

    const file = path.join(
        resultsDir,
        `create-post-${timestamp}.json`,
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