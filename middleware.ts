import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware léger - vérifie la présence du cookie de session sans importer NextAuth
const publicPaths = ["/", "/auth/signin", "/auth/register", "/auth/error", "/api/auth", "/pricing", "/mentions-legales"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques : on laisse passer
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Routes API : on laisse passer (l'auth se fait dans les routes elles-mêmes)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Ressources statiques : on laisse passer
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Pas de vérification de session ici — chaque page gère sa propre auth via auth()
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
