# JJTicket 合约说明文档

## 概述
JJTicket是一个智能合约，允许用户使用JJCoin购买演唱会门票hash，该hash可在Web2系统中兑换实际门票。

## 核心功能

### 1. Hash管理系统
- **添加Hash**: 管理员可批量添加门票hash到合约
- **Hash状态追踪**: 记录hash的购买者、购买时间、使用状态
- **Hash验证**: 为Web2系统提供hash有效性验证

### 2. 购票系统  
- **指定购买**: 用户可购买特定的hash
- **随机购买**: 系统自动分配可用hash
- **JJCoin支付**: 通过ERC20标准与JJCoin集成

### 3. Web2集成接口
- **验证接口**: `verifyTicketHash()`供Web2系统验证hash有效性
- **使用标记**: `markHashAsUsed()`标记hash已在Web2系统中使用
- **事件监听**: 通过事件机制实现链上链下数据同步

## 主要函数说明

### 管理员函数
```solidity
// 批量添加门票hash
function addTicketHashes(bytes32[] memory _hashes) external onlyOwner

// 标记hash已使用（Web2系统调用后）
function markHashAsUsed(bytes32 _hash) external onlyOwner

// 更新票价
function updateTicketPrice(uint256 _newPrice) external onlyOwner

// 提取收益
function withdrawJJCoin(uint256 _amount) external onlyOwner
```

### 用户函数
```solidity
// 购买指定hash
function purchaseTicket(bytes32 _desiredHash) external

// 随机购买可用hash  
function purchaseRandomTicket() external returns (bytes32)

// 查询个人购买的hash
function getBuyerHashes(address _buyer) external view returns (bytes32[] memory)
```

### Web2集成函数
```solidity
// 验证hash是否有效且属于特定买家
function verifyTicketHash(bytes32 _hash, address _buyer) external view returns (bool)

// 获取hash详细信息
function getTicketInfo(bytes32 _hash) external view returns (address, uint256, bool, bool)
```

## 使用流程

### 1. 合约部署
```solidity
constructor(
    address _jjCoinAddress,  // JJCoin合约地址
    uint256 _ticketPrice,    // 门票价格(以JJCoin计)
    uint256 _totalTickets    // 总票数
)
```

### 2. 管理员操作
1. 部署合约
2. 调用`addTicketHashes()`添加门票hash
3. 用户购买后，Web2系统验证hash并调用`markHashAsUsed()`

### 3. 用户购票流程
1. 用户授权合约使用其JJCoin
2. 调用`purchaseTicket()`或`purchaseRandomTicket()`
3. 获得门票hash
4. 在Web2系统中使用hash购买实际门票

### 4. Web2系统集成
1. 监听`TicketPurchased`事件获取购票信息
2. 用户提交hash时调用`verifyTicketHash()`验证
3. 门票发放后调用`markHashAsUsed()`标记已使用

## 事件监听

### 重要事件
```solidity
// 门票购买事件
event TicketPurchased(address indexed buyer, bytes32 indexed ticketHash, uint256 price, uint256 timestamp);

// Hash添加事件  
event HashAdded(bytes32 indexed hashValue, uint256 timestamp);

// Hash使用事件
event HashUsed(bytes32 indexed hashValue, address indexed buyer, uint256 timestamp);
```

## 安全特性

1. **权限控制**: 关键函数仅管理员可调用
2. **重复购买保护**: 防止同一hash被多次购买
3. **余额检查**: 购买前验证JJCoin余额
4. **状态验证**: 多重检查确保操作有效性
5. **事件记录**: 完整的操作历史记录

## 部署准备

### 前置条件
- JJCoin合约已部署并获得地址
- 确定门票价格（JJCoin数量）
- 确定总票数
- 准备门票hash列表

### 部署参数示例
```javascript
const jjCoinAddress = "0x..."; // JJCoin合约地址
const ticketPrice = "1000000000000000000"; // 1 JJCoin (18 decimals)
const totalTickets = 10000; // 总票数
```

## 集成建议

1. **Hash生成策略**: 建议使用加密安全的随机数生成hash
2. **事件监听**: Web2系统应实时监听合约事件
3. **错误处理**: 实现完善的错误处理和用户提示
4. **Gas优化**: 批量操作时注意Gas限制
5. **升级策略**: 考虑代理合约模式支持未来升级

这个设计将hash管理和购票功能集成在同一合约中，保证了数据一致性和操作原子性，同时为Web2系统提供了完善的集成接口。 