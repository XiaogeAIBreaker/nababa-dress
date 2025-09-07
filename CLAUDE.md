# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**小猫更衣** (Little Cat Dressing) is an AI-powered virtual try-on platform that allows users to upload personal photos and clothing images to generate realistic virtual fitting effects. The project uses a charge-based VIP system with Free, Plus, and Pro tiers designed to prevent credit farming abuse.

## Development Commands

### Essential Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Initialize database tables (one-time setup)
curl -X POST http://localhost:3000/api/init-db

# Test database connection
curl http://localhost:3000/api/test

# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","confirmPassword":"123456"}'

# Test user checkin
curl -X POST http://localhost:3000/api/checkin

# Get checkin status  
curl http://localhost:3000/api/checkin

# Get credit packages
curl http://localhost:3000/api/purchase

# Get user stats
curl http://localhost:3000/api/user/stats

# Get user history
curl "http://localhost:3000/api/user/history?type=checkin&limit=10"
```

### Database Operations
```bash
# Check database table status
curl http://localhost:3000/api/init-db

# Initialize all tables (if needed)
curl -X POST http://localhost:3000/api/init-db
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, NextAuth.js authentication
- **Database**: Turso SQLite (libSQL) with edge computing capabilities
- **AI Service**: APIcore AI (gemini-2.5-flash-image) for image generation
- **Deployment**: Cloudflare Pages with global CDN

### Core Business Logic

#### VIP System
- **Free Users**: Weekly checkin (6 credits), 2 credits per generation, 1 clothing item max
- **Plus Users**: Daily checkin (6 credits), 2 credits per generation, 3 clothing items, WeChat upgrade
- **Pro Users**: Daily checkin (6 credits), 2/20 credits per generation, 10 clothing items, purchase required
- **Credit Packages**: ¥6-648 with bonus credits, automatic Pro upgrade
- **Failed generations**: Credits are refunded automatically

#### AI Generation Workflow
1. Credit validation and user permission checks (2 credits single, 20 credits batch)
2. Image processing (Base64 encoding)
3. AI API call with retry mechanism (max 2 retries)
4. Credit deduction on success, refund on failure
5. Generation history logging with credit tracking

### Database Architecture

#### Core Tables
- **users**: User accounts, credits, user_level (free/plus/pro), wechat_upgraded status
- **user_checkins**: Daily/weekly checkin tracking (prevents duplicate checkins)
- **credit_purchases**: Offline purchase records with package details
- **generation_history**: AI generation metadata, status, and credit costs
- **sessions**: NextAuth.js session management

#### Data Access Layer (DAO)
- **UserDAO** (`src/lib/dao/user-dao.ts`): User management, credit operations, VIP level handling
- **CreditsDAO** (`src/lib/dao/credits-dao.ts`): Checkin system, purchase tracking, generation history, statistics

### Authentication & Authorization
- **NextAuth.js** with email/password credentials
- **Middleware** (`src/middleware.ts`) for route protection
- **Session management** with user credit/VIP level state synchronization
- **Manual checkin system** via dedicated API endpoints

### AI Integration Details

#### API Configuration
- **Endpoint**: https://kg-api.cloud/v1/chat/completions  
- **Model**: gemini-2.5-flash-image
- **Authentication**: Bearer token (stored in .env.local)

#### Prompt Engineering
```javascript
const generateTryOnPrompt = (clothingCount = 1) => {
  const basePrompt = `请将用户照片中的人物换上新的服装，要求：
1. 保持人物的面部特征、发型、体型和姿态完全不变
2. 服装要自然贴合人物身形，考虑光影和褶皱效果  
3. 保持原照片的背景、光线和整体氛围
4. 生成真实感强的穿着效果，避免违和感
5. 确保服装的材质、颜色和细节准确还原`;

  return clothingCount > 1 ? 
    basePrompt + `\n6. 请为这一个人物分别生成穿着每件不同服装的效果图` : 
    basePrompt;
};
```

### Environment Configuration

#### Required Environment Variables (.env.local)
```bash
# Turso Database
TURSO_DATABASE_URL=libsql://test-xiaogeaibreaker.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=<your-turso-auth-token>

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secret-key>

# AI Service
APICORE_AI_KEY=<your-apicore-ai-key>

# Admin (for future features)
ADMIN_SECRET=<admin-secret-key>
CRON_SECRET=<cron-secret-key>
```

## Development Patterns

### Component Structure
- **UI Components**: `src/components/ui/` (shadcn/ui based)
- **Feature Components**: Organized by feature domain
- **Providers**: `src/components/providers/` for context and session management

### API Route Patterns
- **Authentication**: `/api/auth/*` (NextAuth.js managed)
- **Database Operations**: `/api/init-db`, `/api/test`
- **Feature APIs**: Follow RESTful patterns with proper error handling

### Data Flow Patterns
1. **User Registration/Login** → Daily credit check → Session creation
2. **Generation Request** → Credit validation → AI API call → Credit deduction → History logging
3. **Daily Credit Distribution** → Scheduled job (planned) → Database update → User notification

### Error Handling Strategy
- **Database Errors**: Graceful fallback with user-friendly messages
- **AI API Failures**: Automatic retry (max 2x) with credit refund on final failure
- **Authentication Errors**: Redirect to login with context preservation
- **Credit Insufficient**: Clear messaging with upgrade path

## Key Business Rules

### Credit Management
- Free users: Weekly checkin (6 credits) per YYYY-W## period
- Plus/Pro users: Daily checkin (6 credits) per YYYY-MM-DD basis
- Generation costs: 2 credits (single), 20 credits (batch)
- Failed generations always refund credits
- Credit purchases automatically upgrade user to Pro tier

### User Permissions
- Free users: Limited to 1 clothing item per generation, weekly checkin
- Plus users: Up to 3 clothing items per generation, daily checkin, WeChat upgrade
- Pro users: Batch generation up to 10 clothing items, daily checkin, purchase required
- All users: Single concurrent generation task limit

### Data Privacy
- User images processed in memory only (no persistent storage)
- Generation results provided as download links
- Personal data encrypted at rest (bcrypt for passwords)

## Future Considerations

### Planned Features (not yet implemented)
- Automatic WeChat payment integration for Plus upgrades
- Online payment system for Pro credit packages
- Advanced image processing and quality optimization
- Mobile app development
- Batch processing optimization
- Admin dashboard for purchase management

### Scaling Considerations
- Database migrations planned for user growth
- CDN optimization for global image serving
- AI API rate limiting and queue management
- Horizontal scaling preparation for high concurrent loads