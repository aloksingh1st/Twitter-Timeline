// prisma/seed/config.ts
import { SeedProfiles } from "./profiles";



const profile =
    (process.argv
        .find((arg) => arg.startsWith("--profile="))
        ?.split("=")[1]
        ?.toUpperCase() as keyof typeof SeedProfiles) ?? "SMALL";

if (!(profile in SeedProfiles)) {
    throw new Error(
        `Invalid profile "${profile}". Available profiles: ${Object.keys(
            SeedProfiles,
        ).join(", ")}`,
    );
}


export const SeedConfig = {
    PROFILE: profile,

    RANDOM: {
        POST_HISTORY_DAYS: 180,
    },

    BATCH: {
        SIZE: 5000,
    },
} as const;



export const ActiveProfile = SeedProfiles[SeedConfig.PROFILE];