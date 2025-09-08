'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Toast 类型定义
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

// Toast 上下文
interface ToastContextType {
  toasts: ToastProps[];
  showToast: (toast: Omit<ToastProps, 'id'>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// Toast Hook
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const hideToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = React.useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      id,
      duration: 5000, // 默认5秒
      ...toast
    };

    setToasts(prev => [...prev, newToast]);

    // 自动隐藏
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  }, [hideToast]);

  const hideAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, hideAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Toast 单项组件
function Toast({ id, type, title, message, onClose }: ToastProps) {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconStyles = {
    success: '🟢',
    error: '🔴', 
    warning: '🟡',
    info: '🔵'
  };

  return (
    <div
      className={cn(
        'relative flex w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300',
        'animate-in slide-in-from-right-full',
        typeStyles[type]
      )}
      role="alert"
    >
      <div className="flex items-start space-x-3 flex-1">
        <span className="text-lg" role="img" aria-label={type}>
          {iconStyles[type]}
        </span>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm mb-1 truncate">
              {title}
            </h4>
          )}
          <p className="text-sm leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-black/10 transition-colors"
        aria-label="关闭通知"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast 容器
function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            onClose={() => hideToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

// 便捷方法
export function useToastHelpers() {
  const { showToast } = useToast();

  return {
    success: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'success', message, title, duration }),
    
    error: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'error', message, title, duration }),
    
    warning: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'warning', message, title, duration }),
    
    info: (message: string, title?: string, duration?: number) => 
      showToast({ type: 'info', message, title, duration }),
    
    // API错误处理
    apiError: (error: any, defaultMessage = '操作失败') => {
      const message = error?.message || error?.error || defaultMessage;
      showToast({ 
        type: 'error', 
        message,
        title: '错误',
        duration: 6000 
      });
    },
    
    // API成功处理
    apiSuccess: (message: string, data?: any) => {
      showToast({ 
        type: 'success', 
        message,
        title: '成功',
        duration: 4000 
      });
    }
  };
}

// 全局错误处理Hook
export function useErrorHandler() {
  const toast = useToastHelpers();

  const handleError = React.useCallback((error: any, context?: string) => {
    console.error(context ? `${context}:` : '错误:', error);
    
    let message = '操作失败，请稍后重试';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    } else if (error?.error) {
      message = error.error;
    }
    
    toast.error(message, context);
  }, [toast]);

  const handleApiResponse = React.useCallback(async (
    promise: Promise<Response>,
    successMessage?: string
  ) => {
    try {
      const response = await promise;
      const result = await response.json();
      
      if (result.success) {
        if (successMessage) {
          toast.success(successMessage);
        }
        return { success: true, data: result.data };
      } else {
        toast.error(result.message || '操作失败');
        return { success: false, error: result.message };
      }
    } catch (error) {
      handleError(error, '网络请求');
      return { success: false, error: '网络请求失败' };
    }
  }, [toast, handleError]);

  return {
    handleError,
    handleApiResponse,
    toast
  };
}