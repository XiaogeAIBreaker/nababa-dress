import { auth } from '@/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // 公开路由，无需认证
  const publicRoutes = [
    '/',
    '/about',
    '/auth/signin',
    '/auth/signup',
    '/api/auth/register',
    '/api/test',
    '/api/init-db'
  ];
  
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/auth/')) {
    return;
  }
  
  // 需要认证的路由，检查是否有有效session
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/signin';
    return Response.redirect(url);
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};