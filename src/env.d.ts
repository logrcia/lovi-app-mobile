/**
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time, but a bare React Native
 * TypeScript project ships no ambient `process` type (and `expo-env.d.ts` is
 * git-ignored and generated on demand, so `tsc` cannot rely on it).
 *
 * This is the minimal declaration needed to type-check that access. It does not
 * emulate Node: nothing here runs on the server.
 */
declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  };
};
