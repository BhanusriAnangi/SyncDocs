import { DefaultSession } from "next-auth";

/**
 * Extend the default Auth.js session types to include the user ID.
 * This enables `session.user.id` to be available throughout the app.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
