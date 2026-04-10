import { useSession } from "@tanstack/react-start/server";
import type { SessionData } from "./session";

export type AppSession = Awaited<ReturnType<typeof useSession<SessionData>>>;

export function getAppSession(): Promise<AppSession> {
	return useSession<SessionData>({
		name: "app_session",
		password: process.env.SESSION_SECRET!,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 7,
		},
	});
}
