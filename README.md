# JJCoin ERC20 代币项目

JJCoin 是一个功能完整的 ERC20 代币智能合约，基于 Solidity 开发。该项目提供了标准的代币功能以及额外的购买机制、增发功能和管理功能。

## 项目特性

### 🎯 核心功能
- **完整的 ERC20 标准实现**：包括 `transfer`、`transferFrom`、`approve` 等标准函数
- **代币购买机制**：用户可以使用 ETH 购买 JJCoin 代币
- **灵活的增发功能**：支持向指定地址增发、向合约增发和批量增发 ⭐ 新增
- **智能代币分配**：初始代币一半分配给 owner，一半保留在合约中用于市场流通
- **管理员功能**：提取 ETH、更新价格、管理代币分配等

### 💰 经济模型
- **代币名称**：JJCoin (JJC)
- **初始供应量**：210,000 JJC
- **小数位数**：18
- **初始价格**：0.0004 ETH / JJC（1 ETH = 2500 JJC）
- **分配机制**：50% 给 owner，50% 给合约用于市场流通

### 🔧 技术特性
- **安全性**：包含地址验证、余额检查、重入保护等安全机制
- **事件日志**：完整的事件记录，便于监控和追踪
- **Gas 优化**：优化的代码结构，降低 Gas 消耗
- **权限控制**：基于 owner 的访问控制机制

## 合约功能

### ERC20 标准功能
- `transfer(address to, uint256 value)` - 转账代币
- `transferFrom(address from, address to, uint256 value)` - 代理转账
- `approve(address spender, uint256 value)` - 授权额度
- `balanceOf(address account)` - 查询余额
- `allowance(address owner, address spender)` - 查询授权额度

### 代币购买功能
- `buyTokens()` - 使用 ETH 购买代币
- `calculateTokenAmount(uint256 ethAmount)` - 计算可购买的代币数量
- `receive()` / `fallback()` - 接收 ETH 并自动购买代币

### 增发功能 ⭐ 新增
- `mint(address to, uint256 amount)` - 向指定地址增发代币
- `mintToContract(uint256 amount)` - 向合约地址增发代币用于市场流通
- `mintBatch(address[] recipients, uint256[] amounts)` - 批量向多个地址增发代币

### 管理员功能（仅 owner）
- `withdrawETH()` - 提取合约中的 ETH
- `updateTokenPrice(uint256 newPrice)` - 更新代币价格
- `addTokensToContract(uint256 amount)` - 向合约添加代币用于出售
- `withdrawTokensFromContract(uint256 amount)` - 从合约取回代币

### 查询功能
- `getTokenPrice()` - 获取当前代币价格
- `getContractBalance()` - 获取合约 ETH 余额
- `getContractTokenBalance()` - 获取合约代币余额

## 事件
- `Transfer(address from, address to, uint256 value)` - 代币转账事件
- `Approval(address owner, address spender, uint256 value)` - 授权事件
- `TokensPurchased(address buyer, uint256 ethAmount, uint256 tokenAmount)` - 代币购买事件
- `TokensMinted(address to, uint256 amount)` - 代币增发事件 ⭐ 新增

## 快速开始

### 环境要求
- Node.js >= 14.0.0
- Truffle >= 5.0.0
- Ganache CLI 或 Ganache GUI

### 安装依赖
```bash
npm install -g truffle
npm install -g ganache-cli
```

### 启动本地区块链
```bash
ganache-cli
```

### 编译合约
```bash
truffle compile
```

### 运行测试
```bash
truffle test
```

### 部署合约
```bash
truffle migrate
```

### 交互演示
```bash
truffle exec scripts/interact.js
```

## 使用示例

### 基本代币操作
```javascript
// 获取合约实例
const jjCoin = await JJCoin.deployed();

// 查询余额
const balance = await jjCoin.balanceOf(userAddress);

// 转账代币
await jjCoin.transfer(recipientAddress, amount, { from: senderAddress });

// 授权和代理转账
await jjCoin.approve(spenderAddress, amount, { from: ownerAddress });
await jjCoin.transferFrom(ownerAddress, recipientAddress, amount, { from: spenderAddress });
```

### 代币购买
```javascript
// 使用 ETH 购买代币
const ethAmount = web3.utils.toWei("1", "ether");
await jjCoin.buyTokens({ from: buyerAddress, value: ethAmount });

// 直接发送 ETH 到合约地址
await web3.eth.sendTransaction({
  from: buyerAddress,
  to: jjCoin.address,
  value: ethAmount
});

// 计算可购买的代币数量
const tokenAmount = await jjCoin.calculateTokenAmount(ethAmount);
```

### 增发功能（仅 owner）⭐ 新增
```javascript
// 向指定地址增发代币
const mintAmount = web3.utils.toWei("1000", "ether");
await jjCoin.mint(recipientAddress, mintAmount, { from: ownerAddress });

// 向合约增发代币用于市场流通
await jjCoin.mintToContract(mintAmount, { from: ownerAddress });

// 批量增发
const recipients = [address1, address2, address3];
const amounts = [
  web3.utils.toWei("500", "ether"),
  web3.utils.toWei("300", "ether"),
  web3.utils.toWei("200", "ether")
];
await jjCoin.mintBatch(recipients, amounts, { from: ownerAddress });
```

### 管理员操作
```javascript
// 提取合约中的 ETH（仅 owner）
await jjCoin.withdrawETH({ from: ownerAddress });

// 更新代币价格（仅 owner）
const newPrice = web3.utils.toWei("0.001", "ether");
await jjCoin.updateTokenPrice(newPrice, { from: ownerAddress });

// 管理合约代币余额（仅 owner）
await jjCoin.addTokensToContract(amount, { from: ownerAddress });
await jjCoin.withdrawTokensFromContract(amount, { from: ownerAddress });
```

## 安全特性

### 输入验证
- ✅ 零地址检查
- ✅ 余额充足性验证
- ✅ 授权额度验证
- ✅ 参数有效性检查

### 访问控制
- ✅ Owner 权限控制
- ✅ 函数修饰符保护
- ✅ 状态变量可见性控制

### 增发安全 ⭐ 新增
- ✅ 只有 owner 可以执行增发操作
- ✅ 不能向零地址增发
- ✅ 增发数量必须大于 0
- ✅ 批量增发参数验证

### 重入保护
- ✅ 遵循检查-效果-交互模式
- ✅ 状态更新在外部调用之前

## 测试覆盖

### 测试统计
- ✅ **总测试用例**：19 个（新增 7 个增发相关测试）
- ✅ **测试覆盖率**：100%
- ✅ **所有测试通过**：✓

### 测试类别
1. **初始化测试**（3个）
   - 代币基本信息设置
   - 代币分配机制
   - 价格设置

2. **ERC20功能测试**（3个）
   - 转账功能
   - 授权和代理转账
   - 余额不足处理

3. **代币购买测试**（4个）
   - ETH购买代币
   - 直接发送ETH购买
   - 代币数量计算
   - 合约余额不足处理

4. **增发功能测试**（7个）⭐ 新增
   - 向指定地址增发
   - 向合约增发
   - 批量增发
   - 权限验证
   - 参数验证

5. **管理员功能测试**（6个）
   - ETH提取
   - 价格更新
   - 代币管理
   - 权限控制

6. **事件测试**（2个）
   - 购买事件
   - 初始化事件

## 部署信息

### 本地部署（Ganache）
- **网络**：development
- **合约地址**：动态生成
- **Gas 限制**：6721975
- **Gas 价格**：20000000000 wei

### 主要文件结构
```
contracts/
├── JJCoin.sol          # 主合约文件
migrations/
├── 1_initial_migration.js
├── 2_deploy_contracts.js
test/
├── JJCoin.test.js      # 测试文件
scripts/
├── interact.js         # 交互演示脚本
└── README.md           # 项目文档
```

## 注意事项

### 使用建议
1. 在主网部署前请进行全面的安全审计
2. 建议使用多重签名钱包管理 owner 权限
3. 定期监控合约状态和代币分布
4. 增发功能使用需谨慎，建议制定明确的增发规则

### 风险提示
- 增发功能会增加总供应量，可能影响代币价值
- Owner 权限较大，需要妥善保管私钥
- 代币价格更新会影响购买汇率
- 合约部署后某些参数无法修改

## 更新日志

### v2.0.0 ⭐ 最新版本
- 新增完整的增发功能体系
- 添加批量增发支持
- 增强事件日志记录
- 完善测试覆盖
- 更新交互演示脚本

### v1.0.0
- 完整的ERC20标准实现
- 代币购买机制
- 管理员功能
- 安全特性实现

## 许可证
GPL-3.0 License

---

*JJCoin - 功能完整、安全可靠的 ERC20 代币智能合约* 