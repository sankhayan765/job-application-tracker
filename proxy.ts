import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/auth/auth";

export default async function proxy(request: NextRequest) {
    const session = await getSession();

    const isSignInPage = request.nextUrl.pathname.startsWith("/sign-in");
    const isSignUpPage = request.nextUrl.pathname.startsWith("/sign-up");
    const isLandingPage = request.nextUrl.pathname === "/";

    if ((isSignInPage || isSignUpPage || isLandingPage) && session?.user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}