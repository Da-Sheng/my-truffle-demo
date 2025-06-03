#!/usr/bin/env node

require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const { Web3 } = require('web3');

async function checkConfig() {
  console.log('🔍 检查Sepolia部署配置...\n');

  const { MNEMONIC, INFURA_PROJECT_ID, ALCHEMY_API_KEY, PRIVATE_KEY } = process.env;

  console.log('📋 环境变量检查:');
  
  let authConfigured = false;
  if (MNEMONIC && MNEMONIC !== "your twelve word mnemonic phrase goes here") {
    console.log('✅ MNEMONIC: 已正确配置');
    authConfigured = true;
  } else if (PRIVATE_KEY && PRIVATE_KEY !== "0x_your_private_key_here") {
    console.log('✅ PRIVATE_KEY: 已正确配置');
    authConfigured = true;
  }
  
  if (!authConfigured) {
    console.log('❌ 需要配置 MNEMONIC 或 PRIVATE_KEY (请使用真实值)');
    return false;
  }

  let rpcConfigured = false;
  if (ALCHEMY_API_KEY && ALCHEMY_API_KEY !== "your_alchemy_api_key_here") {
    console.log('✅ ALCHEMY_API_KEY: 已正确配置');
    rpcConfigured = true;
  } else if (INFURA_PROJECT_ID && INFURA_PROJECT_ID !== "your_infura_project_id_here") {
    console.log('✅ INFURA_PROJECT_ID: 已正确配置');  
    rpcConfigured = true;
  }
  
  if (!rpcConfigured) {
    console.log('❌ 需要配置 ALCHEMY_API_KEY 或 INFURA_PROJECT_ID (请使用真实值)');
    return false;
  }

  if (PRIVATE_KEY && PRIVATE_KEY !== "0x_your_private_key_here") {
    const cleanKey = PRIVATE_KEY.replace('0x', '');
    if (cleanKey.length !== 64 || !/^[a-fA-F0-9]+$/.test(cleanKey)) {
      console.log('❌ 私钥格式不正确，应该是64位十六进制字符串');
      return false;
    }
    console.log('✅ 私钥格式正确');
  }

  console.log('\n🔗 测试网络连接...');
  try {
    let rpcUrl;
    if (ALCHEMY_API_KEY && ALCHEMY_API_KEY !== "your_alchemy_api_key_here") {
      rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
      console.log('🌐 使用 Alchemy RPC');
    } else {
      rpcUrl = `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`;
      console.log('🌐 使用 Infura RPC');
    }

    let provider;
    if (PRIVATE_KEY && PRIVATE_KEY !== "0x_your_private_key_here") {
      const privateKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
      provider = new HDWalletProvider([privateKey], rpcUrl);
    } else {
      provider = new HDWalletProvider(MNEMONIC, rpcUrl);
    }

    const web3 = new Web3(provider);
    
    const chainId = await web3.eth.getChainId();
    const accounts = await web3.eth.getAccounts();
    const balance = await web3.eth.getBalance(accounts[0]);

    console.log('✅ 网络连接成功');
    console.log(`📍 Chain ID: ${chainId} (Sepolia: 11155111)`);
    console.log(`👛 部署地址: ${accounts[0]}`);
    console.log(`💰 ETH 余额: ${web3.utils.fromWei(balance, 'ether')} ETH`);

    let warningsFound = false;
    if (Number(chainId) !== 11155111) {
      console.log('⚠️  注意: 当前不是Sepolia网络');
      warningsFound = true;
    }

    const balanceEth = parseFloat(web3.utils.fromWei(balance, 'ether'));
    if (balanceEth < 0.01) {
      console.log('⚠️  警告: ETH余额不足，建议从水龙头获取测试ETH');
      console.log('📲 推荐水龙头:');
      console.log('   • https://sepoliafaucet.com/');
      console.log('   • https://www.alchemy.com/faucets/ethereum-sepolia');
      warningsFound = true;
    }

    provider.engine.stop();

    if (!warningsFound) {
      console.log('\n🎉 所有检查通过！可以开始部署了');
    } else {
      console.log('\n⚠️  有警告但可以继续，请注意上述提示');
    }

    return true;

  } catch (error) {
    console.log('❌ 网络连接失败:', error.message);
    console.log('\n🔧 可能的解决方案:');
    console.log('1. 检查API Key是否正确');
    console.log('2. 检查网络连接');
    console.log('3. 确认私钥/助记词格式正确');
    return false;
  }
}

async function main() {
  const success = await checkConfig();
  
  if (success) {
    console.log('\n📋 部署命令:');
    console.log('pnpm run compile');
    console.log('pnpm run deploy:sepolia');
  } else {
    console.log('\n❌ 配置检查失败，请检查 .env 文件');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkConfig }; 