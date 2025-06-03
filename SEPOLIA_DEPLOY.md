# Sepolia 测试网部署指南

## 🚀 部署准备

### 1. 获取测试ETH
- 访问 [Sepolia Faucet](https://sepoliafaucet.com/) 获取测试ETH
- 或者访问 [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia) 
- 或者访问 [ChainLink Faucet](https://faucets.chain.link/sepolia)

### 2. 获取RPC API密钥
选择以下服务之一：

**Alchemy (推荐):**
1. 访问 [Alchemy](https://www.alchemy.com/)
2. 创建免费账户
3. 创建新的App，选择Sepolia网络
4. 复制API Key

**Infura (备选):**
1. 访问 [Infura](https://infura.io/)
2. 创建免费账户
3. 创建新项目
4. 复制Project ID

### 3. 配置环境变量
编辑 `.env` 文件：

```bash
# 选择一种认证方式
# 方式1: 使用助记词 (12个单词)
MNEMONIC="your twelve word mnemonic phrase goes here"

# 方式2: 使用私钥 (推荐，更安全)
PRIVATE_KEY="0x_your_private_key_here"

# RPC 服务配置 (选择一种)
ALCHEMY_API_KEY="your_alchemy_api_key_here"
# 或者
INFURA_PROJECT_ID="your_infura_project_id_here"

# Gas 配置 (可选)
GAS_PRICE=20
GAS_LIMIT=8000000

# Etherscan API Key (用于验证合约，可选)
ETHERSCAN_API_KEY="your_etherscan_api_key"
```

## 📋 部署步骤

### 1. 编译合约
```bash
truffle compile
```

### 2. 部署到Sepolia
```bash
truffle migrate --network sepolia --reset
```

### 3. 验证部署
部署成功后，你会看到类似输出：
```
Network:    sepolia (id: 11155111)
- JJCoin: 0xYourJJCoinAddress
- HappyBag: 0xYourHappyBagAddress  
- JJTicket: 0xYourJJTicketAddress
```

### 4. 验证合约源码 (可选)
```bash
truffle run verify JJCoin --network sepolia
truffle run verify HappyBag --network sepolia
truffle run verify JJTicket --network sepolia
```

## 🔧 更新前端配置

部署成功后，需要更新前端的合约地址：

### 1. 更新 JJCoin 配置
编辑 `wagmi-project/src/contracts/jjCoin.ts`:
```typescript
export const jjCoinAddress = "0xYourSepoliaJJCoinAddress" as const
```

### 2. 更新 JJTicket 配置
编辑 `wagmi-project/src/contracts/jjTicket.ts`:
```typescript
export const jjTicketAddress = "0xYourSepoliaJJTicketAddress" as const
```

### 3. 配置网络
确保前端连接到Sepolia网络：
- 在MetaMask中添加Sepolia网络
- 切换到Sepolia网络进行测试

## 🔍 验证部署

### 1. 在Etherscan上查看
- JJCoin: `https://sepolia.etherscan.io/address/0xYourJJCoinAddress`
- JJTicket: `https://sepolia.etherscan.io/address/0xYourJJTicketAddress`

### 2. 测试合约功能
```bash
# 连接到Sepolia控制台
truffle console --network sepolia

# 获取合约实例
let jjCoin = await JJCoin.deployed()
let jjTicket = await JJTicket.deployed()

# 检查合约状态
await jjCoin.name()
await jjCoin.symbol()
await jjTicket.ticketPrice()
```

## 🚨 注意事项

1. **保护私钥**: 永远不要把私钥提交到代码仓库
2. **测试网ETH**: 确保账户有足够的测试ETH支付Gas费
3. **Gas费用**: Sepolia的Gas费比主网便宜很多，但仍需注意优化
4. **合约验证**: 建议在Etherscan上验证合约源码，增加透明度

## 🆘 常见问题

### Q: 部署失败 "insufficient funds"
A: 确保账户有足够的Sepolia ETH，访问水龙头获取测试币

### Q: "Error: Invalid JSON RPC response"
A: 检查RPC URL和API Key是否正确配置

### Q: "Error: nonce too high"
A: 重置MetaMask账户或等待一段时间再重试

### Q: Gas费太高
A: 在truffle-config.js中调整gasPrice和gas参数

## 📚 有用链接

- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [Infura Dashboard](https://infura.io/dashboard)
- [MetaMask网络配置](https://chainlist.org/) 