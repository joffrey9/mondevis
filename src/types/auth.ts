export type UserRole = "admin" | "user" | "viewer";

declare module "next-auth" {
  interface User {
    role: UserRole;
  }
  interface Session {
    user: {
      id: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface JWT {
    role: UserRole;
    id: string;
  }
}
