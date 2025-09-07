import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // 这里可以添加额外的中间件逻辑
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 保护需要认证的路由
        const { pathname } = req.nextUrl;
        
        // 公开路由，无需认证
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/signup',
          '/api/auth/register',
          '/api/test',
          '/api/init-db'
        ];
        
        if (publicRoutes.includes(pathname) || pathname.startsWith('/api/auth/')) {
          return true;
        }
        
        // 需要认证的路由，检查是否有有效token
        return !!token;
      },
    },
  }
);

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