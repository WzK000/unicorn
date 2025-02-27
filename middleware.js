import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Define paths
    const isAuthRoute = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup';
    const isRootPath = req.nextUrl.pathname === '/';
    const isProtectedRoute = !isAuthRoute && 
                             !req.nextUrl.pathname.startsWith('/_next') && 
                             !req.nextUrl.pathname.includes('/api/') &&
                             !req.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/);
    
    // Redirect authenticated users from root to essays page
    if (session && isRootPath) {
      return NextResponse.redirect(new URL('/essays', req.url));
    }
    
    // Redirect authenticated users from auth routes to essays page
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/essays', req.url));
    }
    
    // Redirect unauthenticated users from protected routes to login
    if (!session && isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 