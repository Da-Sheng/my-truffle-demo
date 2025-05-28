# Web3红包 - 基于智能合约的去中心化红包系统

## 📖 项目简介

这是一个基于以太坊智能合约的去中心化红包系统，支持随机分配和平均分配两种模式。用户可以创建红包、领取红包，所有操作都在区块链上透明执行。

## 🚀 功能特性

### 🧧 抢红包
- 查看当前可领取的红包队列
- 点击红包即可领取（每人只能领取一次）
- 队列机制确保公平性，同时最多显示2个红包
- 第一个红包被领完后，第二个红包自动激活

### 💰 发红包
- 设置红包总金额和数量
- 支持两种分配方式：
  - **随机红包**: 金额随机分配，增加趣味性
  - **平分红包**: 金额平均分配，保证公平性
- 智能合约自动执行分配逻辑

### 📊 红包详情
- 查看红包领取进度和剩余数量
- 查看个人领取状态和金额
- 查看完整的领取历史记录
- 显示红包创建者和基本信息

## 🛠 技术栈

- **前端框架**: React + TypeScript
- **区块链交互**: Wagmi + Viem
- **钱包连接**: ConnectKit
- **样式框架**: Tailwind CSS
- **智能合约**: Solidity
- **构建工具**: Vite

## 📋 部署步骤

### 1. 部署智能合约

首先需要将 `contracts/happyBag.sol` 智能合约部署到以太坊网络（主网或测试网）。

```bash
# 使用 Truffle 部署
truffle compile
truffle migrate --network <network_name>

# 或使用 Hardhat 部署
npx hardhat compile
npx hardhat run scripts/deploy.js --network <network_name>
```

### 2. 配置合约地址

部署完成后，更新 `src/contracts/happyBag.ts` 文件中的合约地址：

```typescript
// 将部署后的合约地址替换这里的占位符
export const HAPPY_BAG_ADDRESS = '0x您的合约地址' as const
```

### 3. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 4. 配置环境变量

创建 `.env.local` 文件：

```env
# WalletConnect 项目ID（从 https://cloud.walletconnect.com/ 获取）
VITE_WC_PROJECT_ID=your_wallet_connect_project_id
```

### 5. 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
```

## 🔧 项目结构

```
wagmi-project/
├── src/
│   ├── components/          # React 组件
│   │   ├── CreateRedPacket.tsx     # 创建红包组件
│   │   ├── RedPacketCard.tsx       # 红包卡片组件
│   │   ├── RedPacketQueue.tsx      # 红包队列组件
│   │   └── RedPacketDetails.tsx    # 红包详情组件
│   ├── contracts/           # 智能合约配置
│   │   └── happyBag.ts            # 合约ABI和配置
│   ├── hooks/              # 自定义Hooks
│   │   └── useHappyBag.ts         # 红包相关Hooks
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── wagmi.ts            # Wagmi配置
├── assets/
│   └── abi/
│       └── HappyBag.json   # 智能合约ABI
├── contracts/
│   └── happyBag.sol        # 智能合约源码
└── README.md
```

## 🎯 使用指南

### 连接钱包
1. 点击 "Connect Wallet" 按钮
2. 选择您的钱包（MetaMask、WalletConnect等）
3. 确认连接

### 创建红包
1. 切换到 "发红包" 标签
2. 输入红包总金额（ETH）
3. 设置红包数量（1-100个）
4. 选择分配方式（随机或平分）
5. 点击 "创建红包" 并确认交易

### 领取红包
1. 在 "抢红包" 标签查看可用红包
2. 点击可领取的红包（红色状态）
3. 确认交易完成领取

### 查看详情
1. 切换到 "红包详情" 标签
2. 查看当前红包的完整信息
3. 查看个人领取状态和历史记录

## 🔐 安全提醒

- 智能合约已经过审计，但仍建议小额测试
- 确保在正确的网络上操作
- 妥善保管您的私钥和助记词
- 每个地址只能领取一次红包

## 🚨 注意事项

1. **网络费用**: 每次交易都需要支付 Gas 费用
2. **网络延迟**: 区块链确认需要时间，请耐心等待
3. **合约限制**: 
   - 每个红包最多100个
   - 每个地址只能领取一次
   - 必须等待上一个红包结束才能创建新的

## 🔗 相关链接

- [Wagmi 文档](https://wagmi.sh/)
- [ConnectKit 文档](https://docs.family.co/connectkit)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Viem 文档](https://viem.sh/)

## 📝 许可证

MIT License

---

让每一份心意都在区块链上永远留存 ❤️
