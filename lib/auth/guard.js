import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session) {
    return null;
  }

  return {
    id: Number(session.userId),
    name: session.name,
    username: session.username,
    role: session.role,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

export async function requireRole(role) {
  const { user, response } = await requireAuth();

  if (response) {
    return {
      user: null,
      response,
    };
  }

  if (user.role !== role) {
    return {
      user: null,
      response: Response.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}