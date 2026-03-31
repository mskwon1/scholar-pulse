export const queryKeys = {
  auth: {
    user: () => ['auth', 'user'] as const,
  },
  config: {
    all: () => ['config'] as const,
    detail: (userId: string) => [...queryKeys.config.all(), userId] as const,
  },
};
