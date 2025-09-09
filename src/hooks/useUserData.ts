'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { 
  ExtendedUser, 
  UserStats, 
  UserCreditStats, 
  CheckinStatus, 
  CheckinResult,
  ApiResponse 
} from '@/types';

interface UserDataState {
  user: ExtendedUser | null;
  stats: UserStats | null;
  creditStats: UserCreditStats | null;
  checkinStatus: CheckinStatus | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * 用户数据管理Hook
 * 统一管理用户信息、统计数据和签到状态
 */
export function useUserData() {
  const { data: session, status, update } = useSession();
  const [state, setState] = useState<UserDataState>({
    user: null,
    stats: null,
    creditStats: null,
    checkinStatus: null,
    isLoading: true,
    error: null
  });

  // 更新用户数据
  const updateUserData = useCallback((updates: Partial<ExtendedUser>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null
    }));
  }, []);

  // 刷新用户会话
  const refreshSession = useCallback(async () => {
    try {
      await update();
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      console.error('刷新会话失败:', error);
      setState(prev => ({
        ...prev,
        error: '刷新用户信息失败'
      }));
    }
  }, [update]);

  // 获取用户统计信息
  const fetchUserStats = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/user/stats');
      const result: ApiResponse<UserStats> = await response.json();
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          stats: result.data!,
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.message || '获取统计信息失败'
        }));
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
      setState(prev => ({
        ...prev,
        error: '获取统计信息失败'
      }));
    }
  }, [session?.user?.id]);

  // 获取积分统计信息
  const fetchCreditStats = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const params = new URLSearchParams({
        type: 'all',
        includeStats: 'true'
      });
      
      const response = await fetch(`/api/user/history?${params}`);
      const result: ApiResponse<UserCreditStats> = await response.json();
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          creditStats: result.data!,
          error: null
        }));
      }
    } catch (error) {
      console.error('获取积分统计失败:', error);
    }
  }, [session?.user?.id]);

  // 获取签到状态
  const fetchCheckinStatus = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/checkin');
      const result: ApiResponse<CheckinStatus> = await response.json();
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          checkinStatus: result.data!,
          error: null
        }));
      }
    } catch (error) {
      console.error('获取签到状态失败:', error);
    }
  }, [session?.user?.id]);

  // 执行签到
  const performCheckin = useCallback(async (): Promise<CheckinResult> => {
    if (!session?.user?.id) {
      return { success: false, message: '用户未登录' };
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch('/api/checkin', {
        method: 'POST'
      });
      
      const result: ApiResponse<CheckinResult> = await response.json();
      
      if (result.success && result.data) {
        // 更新签到状态
        await fetchCheckinStatus();
        // 刷新用户会话以更新积分
        await refreshSession();
        
        return result.data;
      } else {
        return {
          success: false,
          message: result.message || '签到失败'
        };
      }
    } catch (error) {
      console.error('签到失败:', error);
      return {
        success: false,
        message: '签到失败，请稍后重试'
      };
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [session?.user?.id, fetchCheckinStatus, refreshSession]);

  // 扣除积分（用于生成等操作）
  const deductCredits = useCallback((amount: number) => {
    if (!state.user?.credits) return;
    
    updateUserData({
      credits: Math.max(0, state.user.credits - amount)
    });
  }, [state.user?.credits, updateUserData]);

  // 增加积分
  const addCredits = useCallback((amount: number) => {
    if (!state.user?.credits) return;
    
    updateUserData({
      credits: state.user.credits + amount
    });
  }, [state.user?.credits, updateUserData]);

  // 更新用户等级
  const updateUserLevel = useCallback((userLevel: 'free' | 'plus' | 'pro') => {
    updateUserData({ userLevel });
  }, [updateUserData]);

  // 初始化用户数据
  useEffect(() => {
    if (status === 'loading') {
      // 只有在首次加载时显示loading，后续会话状态变更不影响界面
      setState(prev => ({ 
        ...prev, 
        isLoading: prev.user === null && prev.stats === null 
      }));
      return;
    }

    if (status === 'unauthenticated') {
      setState({
        user: null,
        stats: null,
        creditStats: null,
        checkinStatus: null,
        isLoading: false,
        error: null
      });
      return;
    }

    if (session?.user) {
      setState(prev => ({
        ...prev,
        user: session.user as ExtendedUser,
        isLoading: false,
        error: null
      }));
      
      // 获取用户相关数据
      fetchUserStats();
      fetchCreditStats();
      fetchCheckinStatus();
    }
  }, [session, status, fetchUserStats, fetchCreditStats, fetchCheckinStatus]);

  return {
    // 状态数据
    user: state.user,
    stats: state.stats,
    creditStats: state.creditStats,
    checkinStatus: state.checkinStatus,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: status === 'authenticated',
    
    // 操作方法
    updateUserData,
    refreshSession,
    fetchUserStats,
    fetchCreditStats,
    fetchCheckinStatus,
    performCheckin,
    deductCredits,
    addCredits,
    updateUserLevel,
    
    // 便捷计算属性
    hasCredits: (state.user?.credits || 0) > 0,
    canCheckin: state.checkinStatus?.canCheckin || false,
    isPremiumUser: state.user?.userLevel === 'plus' || state.user?.userLevel === 'pro',
    isProUser: state.user?.userLevel === 'pro',
    userLevel: state.user?.userLevel || 'free',
    credits: state.user?.credits || 0
  };
}

/**
 * 用户历史记录管理Hook
 */
export function useUserHistory(type: 'checkin' | 'purchase' | 'generation', limit: number = 20) {
  const { data: session } = useSession();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        type,
        limit: limit.toString()
      });
      
      const response = await fetch(`/api/user/history?${params}`);
      const result: ApiResponse = await response.json();
      
      if (result.success && result.data) {
        setHistory(result.data);
      } else {
        setError(result.message || '获取历史记录失败');
      }
    } catch (error) {
      console.error('获取历史记录失败:', error);
      setError('获取历史记录失败');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, type, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory
  };
}