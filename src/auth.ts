import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { UserDAO } from './lib/dao/user-dao';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await UserDAO.findUserByEmail(credentials.email as string);
          if (!user) {
            return null;
          }

          const isValidPassword = await UserDAO.verifyPassword(
            credentials.password as string,
            user.password_hash
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.email,
            userLevel: user.user_level,
            credits: user.credits,
            wechatUpgraded: user.wechat_upgraded
          };
        } catch (error) {
          console.error('认证失败:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userLevel = user.userLevel;
        token.credits = user.credits;
        token.wechatUpgraded = user.wechatUpgraded;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        try {
          const user = await UserDAO.findUserById(parseInt(token.sub));
          if (user) {
            session.user.id = user.id.toString();
            session.user.userLevel = user.user_level;
            session.user.credits = user.credits;
            session.user.wechatUpgraded = user.wechat_upgraded;
            session.user.isPremiumUser = await UserDAO.isPremiumUser(user.id);
            session.user.isProUser = await UserDAO.isProUser(user.id);
          }
        } catch (error) {
          console.error('刷新session失败:', error);
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

// 扩展NextAuth类型
declare module 'next-auth' {
  interface User {
    userLevel?: 'free' | 'plus' | 'pro';
    credits?: number;
    wechatUpgraded?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userLevel?: 'free' | 'plus' | 'pro';
      credits?: number;
      wechatUpgraded?: boolean;
      isPremiumUser?: boolean;
      isProUser?: boolean;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    userLevel?: 'free' | 'plus' | 'pro';
    credits?: number;
    wechatUpgraded?: boolean;
  }
}