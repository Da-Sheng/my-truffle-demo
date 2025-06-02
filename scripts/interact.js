const JJCoin = artifacts.require("JJCoin");

module.exports = async function(callback) {
  try {
    console.log("=== JJCoin 智能合约交互演示 ===\n");

    const accounts = await web3.eth.getAccounts();
    console.log("可用账户:");
    accounts.slice(0, 5).forEach((account, index) => {
      console.log(`  账户 ${index + 1}: ${account}`);
    });
    console.log();

    // 获取部署的合约实例
    const jjCoin = await JJCoin.deployed();
    console.log(`JJCoin 合约地址: ${jjCoin.address}\n`);

    // 基本信息
    const name = await jjCoin.name();
    const symbol = await jjCoin.symbol();
    const decimals = await jjCoin.decimals();
    const totalSupply = await jjCoin.totalSupply();
    const tokenPrice = await jjCoin.getTokenPrice();
    
    console.log("=== 代币基本信息 ===");
    console.log(`代币名称: ${name}`);
    console.log(`代币符号: ${symbol}`);
    console.log(`小数位数: ${decimals}`);
    console.log(`总供应量: ${web3.utils.fromWei(totalSupply, 'ether')} ${symbol}`);
    console.log(`代币价格: ${web3.utils.fromWei(tokenPrice, 'ether')} ETH 每个代币`);
    console.log(`兑换比例: 1 ETH = ${1 / web3.utils.fromWei(tokenPrice, 'ether')} ${symbol}\n`);

    // 查看初始余额
    const owner = accounts[0];
    const buyer = accounts[1];
    const recipient = accounts[2];
    const recipient2 = accounts[3];

    console.log("=== 初始余额 ===");
    const ownerBalance = await jjCoin.balanceOf(owner);
    const contractBalance = await jjCoin.getContractTokenBalance();
    const buyerBalance = await jjCoin.balanceOf(buyer);
    
    console.log(`Owner 余额: ${web3.utils.fromWei(ownerBalance, 'ether')} ${symbol}`);
    console.log(`合约余额: ${web3.utils.fromWei(contractBalance, 'ether')} ${symbol}`);
    console.log(`买家余额: ${web3.utils.fromWei(buyerBalance, 'ether')} ${symbol}\n`);

    // 购买代币
    console.log("=== 代币购买演示 ===");
    const ethAmount = web3.utils.toWei("0.1", "ether");
    console.log(`买家用 ${web3.utils.fromWei(ethAmount, 'ether')} ETH 购买代币...`);
    
    await jjCoin.buyTokens({ from: buyer, value: ethAmount });
    
    const newBuyerBalance = await jjCoin.balanceOf(buyer);
    const newContractBalance = await jjCoin.getContractTokenBalance();
    console.log(`购买后买家余额: ${web3.utils.fromWei(newBuyerBalance, 'ether')} ${symbol}`);
    console.log(`购买后合约余额: ${web3.utils.fromWei(newContractBalance, 'ether')} ${symbol}\n`);

    // 增发功能演示
    console.log("=== 增发功能演示 ===");
    
    // 1. 向指定地址增发
    const mintAmount = web3.utils.toWei("5000", "ether");
    console.log(`Owner 向账户2增发 ${web3.utils.fromWei(mintAmount, 'ether')} ${symbol}...`);
    
    const initialRecipientBalance = await jjCoin.balanceOf(recipient);
    const initialTotalSupply = await jjCoin.totalSupply();
    
    await jjCoin.mint(recipient, mintAmount, { from: owner });
    
    const afterMintRecipientBalance = await jjCoin.balanceOf(recipient);
    const newTotalSupply = await jjCoin.totalSupply();
    
    console.log(`增发前账户2余额: ${web3.utils.fromWei(initialRecipientBalance, 'ether')} ${symbol}`);
    console.log(`增发后账户2余额: ${web3.utils.fromWei(afterMintRecipientBalance, 'ether')} ${symbol}`);
    console.log(`增发前总供应量: ${web3.utils.fromWei(initialTotalSupply, 'ether')} ${symbol}`);
    console.log(`增发后总供应量: ${web3.utils.fromWei(newTotalSupply, 'ether')} ${symbol}\n`);

    // 2. 向合约增发
    const contractMintAmount = web3.utils.toWei("3000", "ether");
    console.log(`Owner 向合约增发 ${web3.utils.fromWei(contractMintAmount, 'ether')} ${symbol} 用于市场流通...`);
    
    const beforeContractBalance = await jjCoin.getContractTokenBalance();
    const beforeTotalSupply = await jjCoin.totalSupply();
    
    await jjCoin.mintToContract(contractMintAmount, { from: owner });
    
    const afterContractBalance = await jjCoin.getContractTokenBalance();
    const afterTotalSupply = await jjCoin.totalSupply();
    
    console.log(`增发前合约余额: ${web3.utils.fromWei(beforeContractBalance, 'ether')} ${symbol}`);
    console.log(`增发后合约余额: ${web3.utils.fromWei(afterContractBalance, 'ether')} ${symbol}`);
    console.log(`增发前总供应量: ${web3.utils.fromWei(beforeTotalSupply, 'ether')} ${symbol}`);
    console.log(`增发后总供应量: ${web3.utils.fromWei(afterTotalSupply, 'ether')} ${symbol}\n`);

    // 3. 批量增发
    const batchRecipients = [recipient, recipient2];
    const batchAmounts = [
      web3.utils.toWei("2000", "ether"), 
      web3.utils.toWei("1500", "ether")
    ];
    
    console.log("=== 批量增发演示 ===");
    console.log(`Owner 批量增发代币到多个地址...`);
    console.log(`  - 账户2: ${web3.utils.fromWei(batchAmounts[0], 'ether')} ${symbol}`);
    console.log(`  - 账户3: ${web3.utils.fromWei(batchAmounts[1], 'ether')} ${symbol}`);
    
    const beforeBatchTotalSupply = await jjCoin.totalSupply();
    const beforeRecipient1Balance = await jjCoin.balanceOf(recipient);
    const beforeRecipient2Balance = await jjCoin.balanceOf(recipient2);
    
    await jjCoin.mintBatch(batchRecipients, batchAmounts, { from: owner });
    
    const afterBatchTotalSupply = await jjCoin.totalSupply();
    const afterRecipient1Balance = await jjCoin.balanceOf(recipient);
    const afterRecipient2Balance = await jjCoin.balanceOf(recipient2);
    
    console.log(`\n批量增发结果:`);
    console.log(`  账户2余额变化: ${web3.utils.fromWei(beforeRecipient1Balance, 'ether')} → ${web3.utils.fromWei(afterRecipient1Balance, 'ether')} ${symbol}`);
    console.log(`  账户3余额变化: ${web3.utils.fromWei(beforeRecipient2Balance, 'ether')} → ${web3.utils.fromWei(afterRecipient2Balance, 'ether')} ${symbol}`);
    console.log(`  总供应量变化: ${web3.utils.fromWei(beforeBatchTotalSupply, 'ether')} → ${web3.utils.fromWei(afterBatchTotalSupply, 'ether')} ${symbol}\n`);

    // 代币转账演示
    console.log("=== 代币转账演示 ===");
    const transferAmount = web3.utils.toWei("50", "ether");
    console.log(`买家向账户3转账 ${web3.utils.fromWei(transferAmount, 'ether')} ${symbol}...`);
    
    const beforeTransferBuyerBalance = await jjCoin.balanceOf(buyer);
    const beforeTransferRecipient2Balance = await jjCoin.balanceOf(recipient2);
    
    await jjCoin.transfer(recipient2, transferAmount, { from: buyer });
    
    const afterTransferBuyerBalance = await jjCoin.balanceOf(buyer);
    const afterTransferRecipient2Balance = await jjCoin.balanceOf(recipient2);
    
    console.log(`转账前买家余额: ${web3.utils.fromWei(beforeTransferBuyerBalance, 'ether')} ${symbol}`);
    console.log(`转账后买家余额: ${web3.utils.fromWei(afterTransferBuyerBalance, 'ether')} ${symbol}`);
    console.log(`转账前账户3余额: ${web3.utils.fromWei(beforeTransferRecipient2Balance, 'ether')} ${symbol}`);
    console.log(`转账后账户3余额: ${web3.utils.fromWei(afterTransferRecipient2Balance, 'ether')} ${symbol}\n`);

    // 查看所有Transfer事件
    console.log("=== 查询最近的Transfer事件 ===");
    const transferEvents = await jjCoin.getPastEvents('Transfer', {
      fromBlock: 0,
      toBlock: 'latest'
    });
    
    console.log(`总共 ${transferEvents.length} 个Transfer事件:`);
    transferEvents.slice(-5).forEach((event, index) => {
      const from = event.returnValues.from;
      const to = event.returnValues.to;
      const value = web3.utils.fromWei(event.returnValues.value, 'ether');
      
      let fromDisplay = from;
      let toDisplay = to;
      
      if (from === '0x0000000000000000000000000000000000000000') {
        fromDisplay = '零地址(增发)';
      } else if (from === jjCoin.address) {
        fromDisplay = '合约地址';
      } else if (from === owner) {
        fromDisplay = 'Owner';
      } else if (from === buyer) {
        fromDisplay = '买家';
      }
      
      if (to === jjCoin.address) {
        toDisplay = '合约地址';
      } else if (to === owner) {
        toDisplay = 'Owner';
      } else if (to === buyer) {
        toDisplay = '买家';
      } else if (to === recipient) {
        toDisplay = '账户2';
      } else if (to === recipient2) {
        toDisplay = '账户3';
      }
      
      console.log(`  ${transferEvents.length - 5 + index + 1}. ${fromDisplay} → ${toDisplay}: ${value} ${symbol}`);
    });

    // 查看TokensMinted事件
    console.log("\n=== 查询增发事件 ===");
    const mintEvents = await jjCoin.getPastEvents('TokensMinted', {
      fromBlock: 0,
      toBlock: 'latest'
    });
    
    console.log(`总共 ${mintEvents.length} 个TokensMinted事件:`);
    mintEvents.forEach((event, index) => {
      const to = event.returnValues.to;
      const amount = web3.utils.fromWei(event.returnValues.amount, 'ether');
      
      let toDisplay = to;
      if (to === jjCoin.address) {
        toDisplay = '合约地址';
      } else if (to === recipient) {
        toDisplay = '账户2';
      } else if (to === recipient2) {
        toDisplay = '账户3';
      }
      
      console.log(`  ${index + 1}. 增发到 ${toDisplay}: ${amount} ${symbol}`);
    });

    // 最终状态
    console.log("\n=== 最终状态总结 ===");
    const finalTotalSupply = await jjCoin.totalSupply();
    const finalOwnerBalance = await jjCoin.balanceOf(owner);
    const finalContractBalance = await jjCoin.getContractTokenBalance();
    const finalBuyerBalance = await jjCoin.balanceOf(buyer);
    const finalRecipientBalance = await jjCoin.balanceOf(recipient);
    const finalRecipient2Balance = await jjCoin.balanceOf(recipient2);
    
    console.log(`总供应量: ${web3.utils.fromWei(finalTotalSupply, 'ether')} ${symbol}`);
    console.log(`Owner余额: ${web3.utils.fromWei(finalOwnerBalance, 'ether')} ${symbol}`);
    console.log(`合约余额: ${web3.utils.fromWei(finalContractBalance, 'ether')} ${symbol}`);
    console.log(`买家余额: ${web3.utils.fromWei(finalBuyerBalance, 'ether')} ${symbol}`);
    console.log(`账户2余额: ${web3.utils.fromWei(finalRecipientBalance, 'ether')} ${symbol}`);
    console.log(`账户3余额: ${web3.utils.fromWei(finalRecipient2Balance, 'ether')} ${symbol}`);
    
    console.log("\n=== 演示完成 ===");
    console.log("JJCoin 合约的所有功能已成功演示！");

  } catch (error) {
    console.error("脚本执行出错:", error);
  }
  
  callback();
}; 