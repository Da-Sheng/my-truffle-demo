#!/bin/bash

echo "🚀 启动 IOC 合约测试界面"
echo "=========================="

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
fi

echo "🌐 启动本地服务器..."
echo "📱 访问地址: http://localhost:8000"
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

# 启动简单的HTTP服务器
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
elif command -v npx &> /dev/null; then
    npx serve -l 8000
else
    echo "❌ 未找到可用的HTTP服务器"
    echo "请安装 Python 或 Node.js 后重试"
    exit 1
fi 