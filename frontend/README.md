# IOC 合约测试界面

基于 Ethers.js 6.0 和 jQuery 3.0 的智能合约交互界面，用于测试您的 IOC 合约。

## 功能特性

- 🔗 **钱包连接** - 支持 MetaMask 钱包连接
- 💰 **充值功能** - 向合约发送 ETH (collectEth)
- 💸 **提取功能** - 从合约提取 ETH (withdraw)
- 📊 **余额查询** - 实时显示合约和用户余额
- 🎯 **事件监听** - 监听合约事件并实时显示
- 📱 **响应式设计** - 支持移动端和桌面端

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 部署合约

首先需要部署您的 IOC 合约到测试网络（如 Sepolia、Goerli 等）。

### 3. 配置合约地址

在 `app.js` 文件中找到以下行：

```javascript
this.contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";
```

将 `YOUR_CONTRACT_ADDRESS_HERE` 替换为您部署的合约地址。

### 4. 启动应用

使用任何静态文件服务器打开 `index.html`，例如：

```bash
# 使用 Python 简单服务器
python3 -m http.server 8000

# 或使用 Node.js serve
npx serve .

# 或使用 Live Server (VS Code 扩展)
```

然后在浏览器中访问 `http://localhost:8000`

## 使用说明

### 连接钱包

1. 确保已安装 MetaMask 浏览器扩展
2. 点击 "连接钱包" 按钮
3. 在 MetaMask 中确认连接

### 充值到合约 (Collect ETH)

1. 在 "充值金额" 输入框中输入要发送的 ETH 数量
2. 点击 "充值到合约" 按钮
3. 在 MetaMask 中确认交易

**注意：** 合约要求发送者不能是合约所有者

### 从合约提取 (Withdraw ETH)

1. 在 "提取金额" 输入框中输入要提取的 ETH 数量
2. 在 "接收地址" 输入框中输入接收 ETH 的地址
3. 点击 "从合约提取" 按钮
4. 在 MetaMask 中确认交易

**注意：** 只有合约所有者才能执行提取操作

### 查看余额

- **合约余额：** 显示合约当前持有的 ETH 总量
- **我的余额：** 显示当前连接账户的 ETH 余额
- 点击 "刷新余额" 可以手动更新余额信息

## 合约接口说明

### 函数

- `collectEth()` - 向合约发送 ETH，触发 CollectEth 事件
- `withdraw(uint256 amount, address _to)` - 提取指定数量的 ETH 到指定地址
- `getBalance()` - 获取合约当前余额
- `name` - 合约名称常量 "IOC"

### 事件

- `CollectEth(string name, uint256 amount)` - 收到 ETH 时触发

## 安全注意事项

1. **测试网络**：建议先在测试网络（如 Sepolia）上测试
2. **私钥安全**：永远不要在主网上使用包含大量资金的账户进行测试
3. **合约验证**：确保合约代码已经过充分测试和审计
4. **交易确认**：每次交易前仔细检查参数和接收地址

## 故障排除

### 常见问题

1. **"请安装MetaMask钱包"**
   - 解决：安装 MetaMask 浏览器扩展

2. **"请先连接钱包并设置合约地址"**
   - 解决：检查是否已正确设置合约地址并连接钱包

3. **"Collect失败: not allow tranfer self"**
   - 解决：使用非合约所有者的账户进行充值操作

4. **"Withdraw失败: not owner"**
   - 解决：使用合约所有者账户进行提取操作

5. **"Not enough ETH to withdraw"**
   - 解决：检查合约余额是否足够，或减少提取金额

### 网络配置

确保 MetaMask 连接到正确的网络（与合约部署的网络一致）。

## 技术栈

- **前端框架：** 原生 HTML/CSS/JavaScript
- **区块链库：** Ethers.js 6.0
- **UI 库：** jQuery 3.0
- **钱包：** MetaMask

## 文件结构

```
frontend/
├── index.html          # 主页面
├── app.js             # 主要逻辑代码
├── package.json       # 依赖配置
├── README.md          # 使用说明
└── node_modules/      # 依赖包
```

## 开发和定制

如需修改界面或添加功能，主要文件：

- `index.html` - 页面结构和样式
- `app.js` - 合约交互逻辑
- 合约 ABI 在 `app.js` 中的 `contractABI` 属性

## 许可证

本项目仅供学习和测试使用。 