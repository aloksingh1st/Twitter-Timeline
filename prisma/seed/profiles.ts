// prisma/seed/profiles.ts

export const SeedProfiles = {
    SMALL: {
        USERS: 100,
        CELEBRITIES: 2,
        POWER: 8,
    },

    MEDIUM: {
        USERS: 1_000,
        CELEBRITIES: 10,
        POWER: 90,
    },

    LARGE: {
        USERS: 10_000,
        CELEBRITIES: 50,
        POWER: 450,
    },
} as const;



export const UserBehavior = {
    NORMAL: {
        POSTS: {
            MIN: 10,
            MAX: 50,
        },
        FOLLOWS: {
            MIN: 20,
            MAX: 100,
        },
    },

    POWER: {
        POSTS: {
            MIN: 100,
            MAX: 500,
        },
        FOLLOWS: {
            MIN: 200,
            MAX: 1000,
        },
    },

    CELEBRITY: {
        POSTS: {
            MIN: 1000,
            MAX: 5000,
        },
        FOLLOWS: {
            MIN: 0,
            MAX: 20,
        },
    },
} as const;