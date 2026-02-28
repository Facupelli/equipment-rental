import { useSession } from "@tanstack/react-start/server";

export interface SessionData {
  accessToken?: string;
  refreshToken?: string; // stored server-side only, never sent to the browser
  accessTokenExpiresAt?: number; // Unix timestamp ms — used by middleware for proactive refresh
}

type AppSession = Awaited<ReturnType<typeof useSession<SessionData>>>;

export function useAppSession(): Promise<AppSession> {
  return useSession<SessionData>({
    name: "app_session",
    password: process.env.SESSION_SECRET!,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  });
}
