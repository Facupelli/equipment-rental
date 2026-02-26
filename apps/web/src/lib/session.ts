import { useSession } from "@tanstack/react-start/server";

export interface SessionData {
  accessToken?: string;
  userId?: string;
  email?: string;
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
