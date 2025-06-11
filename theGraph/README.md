# DataToChain Subgraph

这是一个用于索引 DataToChain 合约数据的 The Graph 子图项目。

## 项目结构

```
theGraph/
├── package.json          # 项目配置和依赖
├── schema.graphql        # GraphQL 模式定义
├── subgraph.yaml        # 子图配置文件
├── src/
│   └── mapping.ts       # 事件处理逻辑
├── abis/
│   └── DataToChain.json # 合约 ABI
└── README.md           # 项目说明
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 生成代码
```bash
npm run codegen
```

### 3. 构建子图
```bash
npm run build
```

### 4. 认证和部署
```bash
# 认证 (使用你的访问令牌)
npm run auth

# 部署到 Hosted Service
npm run deploy

# 或部署到 Graph Studio
npm run deploy-studio
```

## GraphQL 查询示例

### 查询最新消息
```graphql
{
  remarkMessages(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    sender
    decodedData
    timestamp
    blockNumber
    transactionHash
  }
}
```

### 查询用户统计
```graphql
{
  users(first: 5, orderBy: totalMessages, orderDirection: desc) {
    id
    totalMessages
    firstMessageAt
    lastMessageAt
    totalDataSize
    totalGasCost
  }
}
```

### 查询全局统计
```graphql
{
  globalStats(first: 1) {
    totalMessages
    totalUsers
    totalDataSize
    averageMessageSize
    lastUpdated
  }
}
```

### 查询日常统计
```graphql
{
  dailyStats(first: 7, orderBy: date, orderDirection: desc) {
    id
    date
    messageCount
    activeUsers
    newUsers
    totalDataSize
    averageMessageSize
  }
}
```

## 合约信息

- **网络**: Sepolia Testnet
- **合约地址**: `0x76E0c8af09CC6fe8cE97222A5047849Edbd9f467`
- **起始区块**: `8509992`
- **监听事件**: `RemarkMsg(indexed address sender, uint256 timestamp, bytes data)`

## 数据模型

### RemarkMessage
存储每个 RemarkMsg 事件的详细信息，包括发送者、时间戳、数据内容、区块信息和交易信息。

### User
聚合用户级别的统计数据，包括消息数量、数据大小、Gas 消耗等。

### DailyStats
按日统计的数据，用于趋势分析和图表展示。

### GlobalStats
全局统计数据，提供系统整体的运行状况。

### MessageByHour
按小时统计的消息数量，用于分析用户活跃时间段。

## 注意事项

- 虽然官方文档显示 Sepolia 不被支持，但实际上可能可以使用
- 如果部署失败，可以考虑迁移到 Goerli 测试网
- 生产环境建议使用以太坊主网 