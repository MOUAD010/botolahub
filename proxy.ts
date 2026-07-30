import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { routing } from "@/lib/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
      return NextResponse.next();
    }

    if (!request.auth) {
      const login = new URL("/admin/login", request.nextUrl.origin);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }

    return NextResponse.next();
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
