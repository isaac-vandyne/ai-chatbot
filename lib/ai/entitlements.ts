type Entitlements = {
  maxMessagesPerDay: number;
};

export const defaultEntitlements: Entitlements = {
  maxMessagesPerDay: 100, // All Supabase auth users get higher limit
};
