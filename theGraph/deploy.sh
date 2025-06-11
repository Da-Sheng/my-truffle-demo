#!/bin/bash

echo "🚀 DataToChain 子图部署脚本"
echo "================================"

# 检查是否安装了 Graph CLI
if ! command -v graph &> /dev/null; then
    echo "❌ Graph CLI 未安装，正在安装..."
    npm install -g @graphprotocol/graph-cli
fi

echo "📦 步骤 1: 安装依赖"
npm install

echo "🔧 步骤 2: 生成代码"
npm run codegen

echo "🏗️  步骤 3: 构建子图"
npm run build

echo "✅ 构建完成！"
echo ""
echo "🌟 接下来的部署步骤："
echo "================================"
echo ""
echo "方式 1: 部署到 Hosted Service (推荐用于测试)"
echo "  1. 获取访问令牌: https://thegraph.com/hosted-service/"
echo "  2. 运行认证: graph auth --product hosted-service <YOUR_ACCESS_TOKEN>"
echo "  3. 创建子图: graph create --node https://api.thegraph.com/deploy/ <GITHUB_USERNAME>/<SUBGRAPH_NAME>"
echo "  4. 部署子图: graph deploy --product hosted-service <GITHUB_USERNAME>/<SUBGRAPH_NAME>"
echo ""
echo "方式 2: 部署到 Graph Studio (推荐用于生产)"
echo "  1. 访问: https://thegraph.com/studio/"
echo "  2. 创建子图并获取 deployment key"
echo "  3. 运行认证: graph auth --studio <DEPLOYMENT_KEY>"
echo "  4. 部署子图: graph deploy --studio <SUBGRAPH_NAME>"
echo ""
echo "🔍 GraphQL 端点将在部署完成后提供"
echo "📊 可以通过端点查询数据"
echo ""
echo "⚠️  注意事项:"
echo "  - Sepolia 网络支持可能有限"
echo "  - 如果遇到问题，可考虑迁移到 Goerli 或主网"
echo "  - 确保合约地址和起始区块号正确"
echo ""
echo "🎉 准备就绪！开始部署吧！" 