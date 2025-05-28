# 🚀 部署检查清单

## ✅ 部署前检查

### 1. 智能合约部署
- [ ] 编译 `contracts/happyBag.sol` 合约
- [ ] 部署到目标网络（主网/测试网）
- [ ] 记录合约地址
- [ ] 验证合约代码（可选但推荐）

### 2. 前端配置
- [ ] 更新 `src/contracts/happyBag.ts` 中的合约地址
- [ ] 配置 `.env.local` 文件中的 WalletConnect 项目ID
- [ ] 确认网络配置正确（mainnet/sepolia等）

### 3. 依赖检查
- [ ] 运行 `pnpm install` 安装所有依赖
- [ ] 确认 Tailwind CSS 配置正确
- [ ] 验证 TypeScript 编译无错误

### 4. 功能测试
- [ ] 钱包连接功能正常
- [ ] 创建红包功能正常
- [ ] 领取红包功能正常
- [ ] 红包详情显示正常
- [ ] 队列机制工作正常

## 🔧 配置文件清单

### 必须配置的文件：
1. `src/contracts/happyBag.ts` - 合约地址
2. `.env.local` - 环境变量
3. `src/wagmi.ts` - 网络配置（如需要）

### 配置示例：

#### `.env.local`
```env
VITE_WC_PROJECT_ID=your_wallet_connect_project_id
```

#### `src/contracts/happyBag.ts`
```typescript
export const HAPPY_BAG_ADDRESS = '0x您的合约地址' as const
```

## 🌐 网络配置

### 主网部署
- 网络: Ethereum Mainnet
- Chain ID: 1
- RPC: https://mainnet.infura.io/v3/YOUR_KEY

### 测试网部署
- 网络: Sepolia Testnet  
- Chain ID: 11155111
- RPC: https://sepolia.infura.io/v3/YOUR_KEY

## 📋 部署命令

```bash
# 1. 安装依赖
pnpm install

# 2. 构建项目
pnpm build

# 3. 预览构建结果
pnpm preview

# 4. 部署到生产环境
# (根据您的部署平台选择相应命令)
```

## 🔍 验证步骤

1. **本地测试**
   ```bash
   pnpm dev
   ```
   访问 http://localhost:5173

2. **构建测试**
   ```bash
   pnpm build
   pnpm preview
   ```

3. **功能验证**
   - 连接钱包
   - 创建测试红包
   - 领取红包
   - 查看详情

## ⚠️ 注意事项

1. **安全提醒**
   - 确保私钥安全
   - 小额测试后再大额使用
   - 验证合约地址正确性

2. **性能优化**
   - 启用生产环境构建优化
   - 配置CDN加速（如需要）
   - 监控Gas费用

3. **用户体验**
   - 提供清晰的操作指引
   - 显示交易状态
   - 处理网络延迟

## 📞 技术支持

如遇到问题，请检查：
1. 控制台错误信息
2. 网络连接状态
3. 钱包连接状态
4. 合约地址配置

---

🎉 祝您部署顺利！ 