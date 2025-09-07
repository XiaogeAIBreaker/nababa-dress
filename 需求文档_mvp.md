# 产品方案：小猫更衣

## 1. 项目概述 (Introduction)

### 1.1 项目背景

在电商购物场景中，用户在购买衣服时经常会遇到选择困难：即便喜欢一件衣服，也会犹豫它是否适合自己。
传统电商依赖于模特图或平铺展示，无法满足用户对“真实穿着效果”的想象需求。
**小猫更衣**旨在利用 **NanoBanana AI 生成引擎**，让用户上传一张自己照片和一件衣服的图片，即可实现“一键换衣”，快速生成真实感强的虚拟试穿效果。

### 1.2 产品愿景

让每一件服装作品都能零成本、即时地拥有逼真的虚拟展示效果，成为线上服饰电商的 **标配体验**。

### 1.3 MVP 阶段目标

* **首要目标**：实现并上线“一键换衣”核心功能，生成效果满足基本可用标准。
* **技术目标**：完成 NanoBanana 引擎的集成与优化，保证生成稳定性与效率。
* **用户目标**：验证核心吸引力，收集早期用户反馈，形成产品迭代闭环。

---

## 2. 目标用户 (Target Audience)

### 2.1 用户画像

* 线上购物用户：习惯在淘宝、天猫、京东、小红书等平台浏览服饰，但难以想象上身效果。
* 时尚博主 / KOL：需要快速生成换装内容，提高效率和内容多样性。
* 电商卖家：希望展示商品在多样人群上的穿着效果，降低拍摄成本。

### 2.2 用户痛点

1. **难以判断适配度**：只看商品图无法知道自己是否适合。
2. **选择困难症**：用户会因为“不确定自己穿着效果”而放弃购买。
3. **内容生产成本高**：卖家需要大量拍摄模特图，费时费钱。

### 2.3 核心需求

* 一键换衣，效果真实。
* 操作流程简洁，无学习成本。
* 快速生成，等待时间不超过 1 分钟。
---

## 3. 功能设计 (Functional Requirements)

### 3.1 核心功能：一键换衣生成引擎

* 输入：用户人像照片 + 服装图片。
* 输出：用户穿着该服装的高质量合成图。
* 要求：保持用户面部、发型、体型特征不变，衣服贴合自然。

### 3.2 基础功能模块

#### a) 用户账户系统 (UC)
* 注册/登录：MVP 阶段的建议：直接用 NextAuth.js，邮箱加密码登录注册就好了不要自己做邮箱验证、密码重置这些功能等用户量上来了再考虑完善
* 基础个人中心：查看生成记录、管理账户信息。
* 支付方案：我希望是订阅付费,MVP不要太复杂,不对接支付系统,如果用户需 要订阅的话,直接加我微信,通过兑换码的方式来进行订阅.你需要帮我全局评估产品功能,从ROI 和用户心理的角度来考虑,设计一下会员权益,并实现兑换码机制

### 3.3 积分会员体系设计

#### a) 积分消费机制
* **生成成本**：单张图片生成成本 0.5 元
* **积分定价**：单次生成消耗 1.5 积分（对应 0.75 元，50% 利润率）
* **每日赠送**：Free用户每日获得 10 积分（约6-7次免费生成）
* **失败处理**：生成失败不扣积分，显示"生成失败，退还积分"

#### b) 用户等级与权益

| 功能特权 | Free用户 | Plus用户 |
|---------|----------|----------|
| **一次生成数量** | 1件衣服 | 最多10件衣服 |
| **注册赠送** | 10积分 | 10积分 |
| **每日赠送** | **10积分/天** | **10积分/天** |
| **订阅积分** | - | 月度80积分，年度1000积分 |
| **积分消耗** | 1.5积分/次生成 | 1.5积分/次生成 |
| **任务并发** | 等待当前任务完成 | 等待当前任务完成 |
| **生成失败** | 不扣积分 | 不扣积分 |
| **重新生成** | ✓ | ✓ |
| **图片下载** | ✓ | ✓ |
| **订阅价格** | 免费 | 月度19元，年度199元 |

#### c) Plus会员定价策略

**Plus月度会员**：19元/月
* 包含80积分（53次生成）
* 单价：0.36元/次
* 批量生成特权（1次最多10件衣服）
* 同样享受每日10积分赠送

**Plus年度会员**：199元/年  
* 包含1000积分（666次生成）
* 单价：0.3元/次（60折优惠）
* 批量生成特权（1次最多10件衣服）
* 同样享受每日10积分赠送

#### d) 积分管理规则
* **积分有效期**：订阅到期后积分清零
* **积分转移**：不支持积分转移或赠送
* **每日积分发放机制**：
  - 每日北京时间00:00自动发放10积分
  - 所有用户（Free和Plus）均享受每日赠送
  - 每日积分发放记录防重复，每用户每天只能领取一次
  - 积分发放失败时有补发机制
* **兑换码机制**：通过微信联系获取兑换码，输入后获得对应积分和订阅时长

---

## 4. 技术与非功能性需求

### 4.1 技术依赖

* **强制依赖**：NanoBanana AI 生成引擎或其 API，方法见下
---
请求地址   
https://api.apicore.ai/v1/chat/completions

APIkey   
sk-yUPD9rfqfCrhxVzwmadPNlR3dtQ67PqWshJVgYihz8EWWU8D

请求方式
遵循OpenAI请求方式，用post请求

请求示例
{
  "model": "gemini-2.5-flash-image",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "请详细描述这张图片的内容，包括主体、背景和整体氛围。"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,{YOUR_BASE64_ENCODED_IMAGE_STRING}"
          }
        }
      ]
    }
  ],
  "max_tokens": 500
}

返回示例
{
    "id": "chatcmpl-89Dwc9w2gODZ0o23Vo7wZu7TFXV1W",
    "object": "chat.completion",
    "created": 1756644511,
    "model": "gemini-2.5-flash-image",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "Here you go! \n![image](https://google.datas.systems/fileSystem/response_images/287/2025/08/31/1756644511648852626_8060.png)"
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 112,
        "completion_tokens": 40,
        "total_tokens": 152,
        "prompt_tokens_details": {
            "text_tokens": 105
        },
        "completion_tokens_details": {
            "content_tokens": 40
        }
    }
}
---

* **存储**：选用tursor sqlite
Token：eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjIwNzM1Mzk2NjMsImlhdCI6MTc1NzIyOTI2MywiaWQiOiIxMjYxMDIxNS0wNzI1LTQ2MDYtYTYwNi01ZmI5MTM4OTFjOTEiLCJyaWQiOiJjYTk0YjhhNy04ODQ4LTRjN2MtYWNiOC1lZjMwNjU4M2FhZTcifQ.nDic9nnikV8ZLpRz_4CvMdx_8V1IY1WwuYnIsxsB5DzI6nIBUjc4e_qyDhaQG8jwXKtTr-zWopsvYOB277IgDg
地址：libsql://test-xiaogeaibreaker.aws-ap-northeast-1.turso.io


* **全栈框架**：Next.js（利于快速上线 Web 端 MVP）。

### 4.2 AI换衣技术实现细节

#### a) AI生成引擎集成
**API地址**：https://api.apicore.ai/v1/chat/completions
**模型**：gemini-2.5-flash-image
**认证**：sk-yUPD9rfqfCrhxVzwmadPNlR3dtQ67PqWshJVgYihz8EWWU8D

#### b) 换衣专业Prompt设计
```javascript
const generateTryOnPrompt = (clothingCount = 1) => {
  const basePrompt = `请将用户照片中的人物换上新的服装，要求：
1. 保持人物的面部特征、发型、体型和姿态完全不变
2. 服装要自然贴合人物身形，考虑光影和褶皱效果  
3. 保持原照片的背景、光线和整体氛围
4. 生成真实感强的穿着效果，避免违和感
5. 确保服装的材质、颜色和细节准确还原
6. 如果是连衣裙等全身服装，要合理调整下半身`;

  const multiplePrompt = clothingCount > 1 ? 
    `\n7. 请为这一个人物分别生成穿着每件不同服装的效果图，每张图保持人物一致性` : "";
    
  return basePrompt + multiplePrompt;
};
```

#### c) 调用策略与重试机制
* **调用方式**：遵循OpenAI标准POST请求格式
* **图片输入**：base64编码格式
* **重试策略**：失败后立即重试2次，无间隔时间
* **超时设置**：单次请求超时60秒
* **并发控制**：用户同时只能有1个生成任务进行

#### d) 生成质量保证
* **目标效果**：真实感优先，贴近现实穿着效果
* **质量标准**：至少70%用户认可"可作为参考"
* **失败场景**：照片不清晰、衣服识别失败等
* **错误处理**：最终失败显示"生成失败，退还积分"，不提供重新生成按钮

### 4.2 性能指标

* **生成时间**：单张图片 ≤ 1 分钟。
* **并发承载**：初期目标 1,000 并发请求不宕机。
* **可扩展性**：后续支持 GPU 服务器集群水平扩展。

### 4.3 易用性要求

* **极简流程**：从登录到结果不超过 4 步。
* **明确引导**：按钮/操作带有直观文字或图标提示。
* **web端支持**：优先上线 Web H5。

### 4.4 用户体验流程优化

#### a) 生成进度提示
* **进度条类型**：状态文字进度条
* **进度状态**：
  - "正在上传图片..." 
  - "正在分析照片..."
  - "正在生成图片..."
  - "生成完成，请下载"
* **无百分比显示**：仅显示当前状态文字

#### b) 任务队列管理
* **并发限制**：用户同时只能有1个生成任务
* **排队机制**：新任务需等待当前任务完成
* **状态反馈**：清晰显示当前任务状态

#### c) 错误处理与用户提示
* **生成失败**：显示"生成失败，退还积分"
* **积分不足**：显示当前积分余额和充值引导
* **权限限制**：Free用户批量上传时提示升级
* **无重试按钮**：失败后不提供页面重试选项

#### d) 图片处理体验
* **上传格式**：支持主流图片格式，无尺寸限制
* **预览功能**：上传后即时显示图片预览
* **数量控制**：
  - Free用户：最多上传1件衣服
  - Plus用户：最多上传10件衣服
* **下载机制**：生成完成后直接提供下载链接，无需存储

### 4.5 技术架构设计

#### a) 前端技术栈
* **框架**：Next.js 14 (App Router) + TypeScript
* **样式**：Tailwind CSS + shadcn/ui 组件库
* **状态管理**：React Context + useState
* **认证**：NextAuth.js（邮箱+密码）
* **部署平台**：Cloudflare Pages

#### b) 后端技术栈
* **API层**：Next.js API Routes
* **数据库**：Turso SQLite (libSQL)
* **文件处理**：内存处理，不持久化存储
* **AI接口**：APIcore AI (gemini-2.5-flash-image)

#### c) 数据库设计
```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  subscription_type TEXT DEFAULT 'free', -- free, plus_monthly, plus_yearly
  credits INTEGER DEFAULT 10, -- 积分余额
  subscription_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 兑换码表
CREATE TABLE redemption_codes (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  credits INTEGER NOT NULL, -- 兑换的积分数
  subscription_type TEXT, -- 订阅类型
  subscription_days INTEGER, -- 订阅天数
  used_by_user_id INTEGER,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (used_by_user_id) REFERENCES users (id)
);

-- 生成历史表（仅记录元数据）
CREATE TABLE generation_history (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  credits_used INTEGER NOT NULL,
  clothing_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 每日积分发放记录表
CREATE TABLE daily_credits_log (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  credits_awarded INTEGER DEFAULT 10,
  award_date DATE NOT NULL, -- 格式: YYYY-MM-DD
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, award_date), -- 防止同一天重复发放
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### d) 核心业务逻辑
```javascript
// 生成换衣图片的核心逻辑
const generateTryOn = async (userId, userImage, clothingImages) => {
  // 1. 权限与积分检查
  const user = await getUserById(userId);
  const requiredCredits = clothingImages.length * 1.5; // 更新为1.5积分/次
  
  if (user.credits < requiredCredits) {
    throw new Error('积分不足');
  }
  
  if (user.subscription_type === 'free' && clothingImages.length > 1) {
    throw new Error('免费用户只能一次生成一件衣服');
  }
  
  // 2. 调用AI接口生成（重试机制）
  let retryCount = 0;
  while (retryCount <= 2) {
    try {
      const results = await callAIGenerationAPI(userImage, clothingImages);
      
      // 3. 成功后扣除积分
      await updateUserCredits(userId, -requiredCredits);
      await createGenerationRecord(userId, requiredCredits, clothingImages.length, 'completed');
      
      return results;
    } catch (error) {
      retryCount++;
      if (retryCount > 2) {
        // 最终失败不扣积分
        await createGenerationRecord(userId, 0, clothingImages.length, 'failed');
        throw new Error('生成失败，退还积分');
      }
    }
  }
};

// 每日积分发放逻辑
const awardDailyCredits = async (userId) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
  
  try {
    // 检查今日是否已发放
    const existingRecord = await getDailyCreditRecord(userId, today);
    if (existingRecord) {
      return { success: false, message: '今日积分已发放' };
    }
    
    // 发放积分
    await updateUserCredits(userId, 10);
    await createDailyCreditRecord(userId, 10, today);
    
    return { success: true, message: '每日积分发放成功' };
  } catch (error) {
    console.error('每日积分发放失败:', error);
    return { success: false, message: '发放失败，请稍后重试' };
  }
};

// 系统定时任务：每日00:00自动为所有用户发放积分
const scheduledDailyCredits = async () => {
  const allUsers = await getAllActiveUsers();
  
  for (const user of allUsers) {
    await awardDailyCredits(user.id);
  }
  
  console.log(`每日积分发放完成，共处理 ${allUsers.length} 个用户`);
};
```

#### e) 安全与性能
* **数据安全**：用户图片不持久化存储，处理完即删除
* **认证安全**：NextAuth.js标准认证，密码bcrypt加密
* **API限制**：用户级别的并发控制，同时最多1个任务
* **性能优化**：图片压缩处理，CDN加速静态资源

---

## 5. 业务流程 (User Flow)

```mermaid
flowchart TD
    A[用户登录/注册] --> B[检查积分余额]
    B --> C[上传个人照片]
    C --> D{用户类型?}
    D -->|Free用户| E[上传1件衣服照片]
    D -->|Plus用户| F[上传1-10件衣服照片]
    E --> G[检查积分是否足够]
    F --> G
    G -->|积分不足| H[提示充值或升级]
    G -->|积分充足| I[开始生成任务]
    I --> J[显示进度条状态]
    J --> K[调用AI接口生成]
    K --> L{生成是否成功?}
    L -->|失败| M[立即重试最多2次]
    M --> L
    L -->|最终失败| N[显示失败信息，积分退还]
    L -->|成功| O[扣除积分，显示结果]
    O --> P[用户下载图片]
    H --> Q[升级会员或充值积分]
    Q --> C
```

---

## 6. MVP 验收标准

### 6.1 核心功能验收
1. **换衣生成功能**：用户能够顺利上传照片 + 衣服图，生成结果 ≤1分钟。
2. **生成质量标准**：生成效果清晰自然，至少 70% 用户认可"可作为参考"。
3. **用户体验流程**：产品流程 ≤4 步，用户 3 分钟内完成首个结果生成。
4. **系统稳定性**：系统稳定运行 7×24h，核心功能错误率 <1%。

### 6.2 积分会员体系验收
5. **积分系统**：注册用户获得10积分，生成成功扣除1.5积分，失败不扣分。
6. **每日积分发放**：所有用户每日北京时间00:00获得10积分，防重复发放机制正常。
7. **权限控制**：Free用户限制1件衣服，Plus用户支持1-10件衣服批量生成。
8. **兑换码功能**：兑换码输入后正确增加积分和订阅时长。
9. **订阅管理**：订阅到期后积分清零，Plus特权失效。
10. **Plus会员定价**：月度19元，年度199元，积分数量正确。

### 6.3 技术架构验收  
11. **数据库集成**：Turso SQLite连接正常，用户数据持久化存储。
12. **每日积分表**：daily_credits_log表正常工作，防重复发放机制有效。
13. **AI接口调用**：APIcore AI接口调用成功率 >95%，重试机制正常工作。
14. **认证系统**：NextAuth.js邮箱密码登录注册功能正常。
15. **部署运行**：Cloudflare Pages部署成功，访问稳定。
16. **定时任务**：每日00:00积分发放定时任务正常执行。

### 6.4 用户体验验收
17. **进度提示**：生成过程显示状态文字进度条，用户体验流畅。  
18. **错误处理**：失败时正确显示"生成失败，退还积分"提示。
19. **权限提示**：Free用户上传多件衣服时正确提示升级。
20. **积分显示**：用户界面正确显示当前积分余额和每日获取状态。
21. **移动端适配**：H5页面在移动设备上正常使用。

---

