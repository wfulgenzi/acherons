import { createAuthClient } from "better-auth/react";

// No baseURL needed — the client uses relative paths and works on any domain.
export const authClient = createAuthClient({});

export const { signIn, signUp, signOut, useSession } = authClient;
