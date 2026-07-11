export const SeedConfig = {
    USERS: 1_000,

    POSTS: {
        MIN_PER_USER: 50,
        MAX_PER_USER: 150,
    },

    FOLLOWS: {
        MIN_PER_USER: 20,
        MAX_PER_USER: 100,
    },

    RANDOM: {
        POST_HISTORY_DAYS: 180,
    },

    BATCH: {
        SIZE: 5_000,
    },
} as const;