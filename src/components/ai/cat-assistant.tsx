'use client';

import { useMemo } from 'react';
import type { UserLevel } from '@/types';

interface CatAssistantProps {
  size?: 'sm' | 'md' | 'lg';
  userLevel?: UserLevel;
  expression?: 'happy' | 'excited' | 'thinking' | 'loving' | 'winking';
  className?: string;
}

/**
 * 小猫AI助手头像组件
 * 根据用户等级和表情显示不同的小猫头像
 */
export function CatAssistant({ 
  size = 'md', 
  userLevel = 'free',
  expression = 'happy',
  className = '' 
}: CatAssistantProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-4xl'
  };

  const levelDecorations = {
    free: '', // 普通小猫
    plus: '🎀', // 蓝色蝴蝶结
    pro: '👑'   // 金色皇冠
  };

  const expressions = {
    happy: '😸',
    excited: '😻',
    thinking: '🤔',
    loving: '😽',
    winking: '😉'
  };

  const catEmoji = expressions[expression];
  const decoration = levelDecorations[userLevel];

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {/* 主要头像背景 */}
      <div className="absolute inset-0 gradient-pink-warm rounded-full opacity-80 cat-pulse"></div>
      
      {/* 小猫表情 */}
      <div className="relative z-10 cat-float">
        {catEmoji}
      </div>
      
      {/* VIP装饰 */}
      {decoration && (
        <div className={`absolute -top-1 -right-1 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}`}>
          {decoration}
        </div>
      )}
    </div>
  );
}

/**
 * 小猫AI话术系统
 */
export class CatSpeechSystem {
  // 问候语
  static getGreeting(userName?: string): string {
    const greetings = [
      `嗨，小仙女${userName ? ` ${userName}` : ''}！✨ 今天想试穿什么美美的服装呢？`,
      `欢迎回来呀～${userName ? ` ${userName}` : '小可爱'}！🐱 我已经准备好为你服务了！`,
      `哇！${userName ? userName : '小仙女'}又来啦～💕 快让我帮你变得更美吧！`,
      `小猫我想死你了～${userName ? userName : '宝贝'}！😽 今天要试什么新搭配？`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 照片上传夸赞
  static getPhotoCompliment(): string {
    const compliments = [
      '哇！你的照片好美呀！✨ 我已经分析了你的体型，接下来选一件心仪的服装吧～',
      '这张照片拍得真棒！📸 你的气质很好呢，一定能穿出很棒的效果！',
      '小仙女的颜值真高！😻 我迫不及待要为你生成试穿效果了～',
      '完美的照片！💖 你的身材比例很好，试穿效果一定超赞的！'
    ];
    return compliments[Math.floor(Math.random() * compliments.length)];
  }

  // 服装选择认可
  static getClothingApproval(itemType?: string): string {
    const approvals = [
      `这件${itemType || '服装'}眼光真不错！💫 颜色很适合你呢，正在为你量身定制试穿效果...`,
      `哇！选得太棒了！✨ 这件${itemType || '服装'}和你的气质很配哦～`,
      `小仙女的品味真好！👗 我感觉这件${itemType || '服装'}穿在你身上会超级好看！`,
      `这个选择我给满分！💯 ${itemType || '服装'}的版型很赞，马上就好～`
    ];
    return approvals[Math.floor(Math.random() * approvals.length)];
  }

  // 生成过程中的陪伴话语
  static getGeneratingMessages(): string[] {
    return [
      '正在分析你的身材比例... 🤔',
      '正在匹配服装版型... ✨',
      '正在调整光影效果... 🎨',
      '正在渲染最佳试穿效果... 💫',
      '马上就好啦，耐心等等哦～ 💕'
    ];
  }

  // 生成成功庆祝
  static getSuccessMessage(): string {
    const messages = [
      '登登登！你的专属试穿效果出炉啦！✨ 是不是超级好看？',
      '哇！效果太惊艳了！😍 小仙女穿什么都美美哒～',
      '完美！这就是我想要的效果！🎉 你绝对是最美的小仙女！',
      '太棒了！试穿效果超级自然！💖 你一定要保存下来哦～'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // 继续生成邀请
  static getContinueInvite(): string {
    const invites = [
      '还想试试其他服装吗？我还能帮你生成更多美美的搭配哦～ 💕',
      '要不要再试一件？小猫我还有很多创意呢！✨',
      '这套搭配很棒！想看看其他风格的试穿效果吗？🌟',
      '小仙女还想尝试什么搭配？我随时为你服务～ 😽'
    ];
    return invites[Math.floor(Math.random() * invites.length)];
  }

  // 失败安慰
  static getFailureComfort(): string {
    const comforts = [
      '啊呀～出了点小问题呢 😿 不过别担心，积分已经退还给你啦！我们再试一次吧～',
      '小猫我刚才走神了～ 🙈 积分已经还给你了，让我们重新开始吧！',
      '咪呜～技术小故障呢 😸 积分安全退还！小仙女再上传一次吧～',
      '不好意思让你等了～ 💔 积分已经原路返还，我们再来一次！这次一定成功！'
    ];
    return comforts[Math.floor(Math.random() * comforts.length)];
  }

  // 积分不足提醒
  static getInsufficientCreditsMessage(required: number, current: number): string {
    return `小仙女，这次生成需要 ${required} 积分，但你现在只有 ${current} 积分呢～ 😿\n要不要先去充值一下？充值还能升级Pro哦！💎`;
  }

  // VIP升级邀请
  static getUpgradeInvite(currentLevel: UserLevel): string {
    if (currentLevel === 'free') {
      return '小仙女，要不要升级Plus？微信验证就能免费升级，还能每天签到呢！💫';
    } else if (currentLevel === 'plus') {
      return '想要更多特权吗？升级Pro可以批量生成10件服装哦！而且还有专属客服～ 👑';
    }
    return '你已经是Pro用户啦！享受最高级的服务吧～ 🌟';
  }

  // 根据用户等级获取个性化称呼
  static getPersonalizedAddress(userLevel: UserLevel): string {
    switch (userLevel) {
      case 'pro':
        return 'Pro小仙女';
      case 'plus':
        return 'Plus小可爱';
      case 'free':
      default:
        return '小仙女';
    }
  }
}