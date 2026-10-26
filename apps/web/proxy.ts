import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

// Paths an anonymous visitor may reach. "/" is public because app/page.tsx
// decides where to send the visitor based on the session.
const PUBLIC_PATHS = ["/", "/login", "/guest", "/register"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();
  const role = session?.user?.role;
  const isGuest = role === "guest";

  if (!session) {
    return isPublicPath(pathname)
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.redirect(
      new URL(isGuest ? "/guest" : "/dashboard", request.url),
    );
  }

  if (isGuest) {
    if (pathname === "/" || pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/guest", request.url));
    }
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/guest", request.url));
  }

  // Authenticated staff/admin visiting the public guest area go to dashboard.
  if (pathname === "/guest" || pathname.startsWith("/guest/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
