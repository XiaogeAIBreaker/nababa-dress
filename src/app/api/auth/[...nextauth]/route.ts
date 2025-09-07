import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Note: NextAuth.js is not compatible with Edge Runtime
// export const runtime = 'edge';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };