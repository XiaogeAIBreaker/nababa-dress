-- 数据库迁移脚本：订阅制 → 充值VIP制
-- 警告：此脚本会删除现有数据，仅适用于开发环境

-- 1. 删除所有现有表和索引
DROP TABLE IF EXISTS generation_history;
DROP TABLE IF EXISTS daily_credits_log;
DROP TABLE IF EXISTS redemption_codes;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- 2. 删除所有索引
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_subscription;
DROP INDEX IF EXISTS idx_redemption_code;
DROP INDEX IF EXISTS idx_redemption_used;
DROP INDEX IF EXISTS idx_generation_user;
DROP INDEX IF EXISTS idx_generation_status;
DROP INDEX IF EXISTS idx_daily_credits_date;
DROP INDEX IF EXISTS idx_daily_credits_user;
DROP INDEX IF EXISTS idx_sessions_token;
DROP INDEX IF EXISTS idx_sessions_expires;