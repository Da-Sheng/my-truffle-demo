const JJCoin = artifacts.require("JJCoin");

contract("JJCoin", (accounts) => {
  let jjCoin;
  const owner = accounts[0];
  const buyer = accounts[1];
  const recipient = accounts[2];
  const spender = accounts[3];
  const recipient2 = accounts[4];

  beforeEach(async () => {
    jjCoin = await JJCoin.new({ from: owner });
  });

  describe("初始化测试", () => {
    it("应该正确设置代币基本信息", async () => {
      const name = await jjCoin.name();
      const symbol = await jjCoin.symbol();
      const decimals = await jjCoin.decimals();
      const totalSupply = await jjCoin.totalSupply();

      assert.equal(name, "JJCoin", "代币名称不正确");
      assert.equal(symbol, "JJC", "代币符号不正确");
      assert.equal(decimals.toNumber(), 18, "小数位数不正确");
      assert.equal(totalSupply.toString(), "210000000000000000000000", "总供应量不正确"); // 21万 * 10^18
    });

    it("应该将一半代币分配给合约创建者，一半给合约", async () => {
      const totalSupply = await jjCoin.totalSupply();
      const ownerBalance = await jjCoin.balanceOf(owner);
      const contractBalance = await jjCoin.balanceOf(jjCoin.address);
      
      const expectedShare = totalSupply.div(web3.utils.toBN(2)); // 总量的一半

      assert.equal(ownerBalance.toString(), expectedShare.toString(), "owner余额应该等于总供应量的一半");
      assert.equal(contractBalance.toString(), expectedShare.toString(), "合约余额应该等于总供应量的一半");
      
      // 验证总和等于总供应量
      const totalBalance = ownerBalance.add(contractBalance);
      assert.equal(totalBalance.toString(), totalSupply.toString(), "owner和合约余额之和应该等于总供应量");
    });

    it("应该正确设置代币价格", async () => {
      const tokenPrice = await jjCoin.getTokenPrice();
      const expectedPrice = web3.utils.toWei("1", "ether") / 2500; // 1 ETH / 2500

      assert.equal(tokenPrice.toString(), Math.floor(expectedPrice).toString(), "代币价格不正确");
    });
  });

  describe("ERC20功能测试", () => {
    it("应该能够转账代币", async () => {
      const transferAmount = web3.utils.toWei("1000", "ether");
      
      await jjCoin.transfer(recipient, transferAmount, { from: owner });
      
      const recipientBalance = await jjCoin.balanceOf(recipient);
      assert.equal(recipientBalance.toString(), transferAmount, "转账后余额不正确");
    });

    it("应该能够授权和transferFrom", async () => {
      const approveAmount = web3.utils.toWei("5000", "ether");
      const transferAmount = web3.utils.toWei("2000", "ether");

      // 授权
      await jjCoin.approve(spender, approveAmount, { from: owner });
      const allowance = await jjCoin.allowance(owner, spender);
      assert.equal(allowance.toString(), approveAmount, "授权额度不正确");

      // 代理转账
      await jjCoin.transferFrom(owner, recipient, transferAmount, { from: spender });
      
      const recipientBalance = await jjCoin.balanceOf(recipient);
      const remainingAllowance = await jjCoin.allowance(owner, spender);
      
      assert.equal(recipientBalance.toString(), transferAmount, "transferFrom后余额不正确");
      
      // 修复BigNumber比较问题
      const expectedRemaining = web3.utils.toBN(approveAmount).sub(web3.utils.toBN(transferAmount));
      assert.equal(remainingAllowance.toString(), expectedRemaining.toString(), "剩余授权额度不正确");
    });

    it("应该在余额不足时拒绝转账", async () => {
      const transferAmount = web3.utils.toWei("1000000", "ether"); // 超过owner余额
      
      try {
        await jjCoin.transfer(recipient, transferAmount, { from: buyer });
        assert.fail("应该抛出异常");
      } catch (error) {
        assert(error.message.includes("Insufficient balance"), "错误信息不正确");
      }
    });
  });

  describe("代币购买功能测试", () => {
    it("应该能够用ETH购买代币", async () => {
      const ethAmount = web3.utils.toWei("1", "ether");
      const expectedTokens = web3.utils.toWei("2500", "ether"); // 1 ETH = 2500 JJC

      const initialBuyerBalance = await jjCoin.balanceOf(buyer);
      const initialContractBalance = await jjCoin.balanceOf(jjCoin.address);

      await jjCoin.buyTokens({ from: buyer, value: ethAmount });

      const finalBuyerBalance = await jjCoin.balanceOf(buyer);
      const finalContractBalance = await jjCoin.balanceOf(jjCoin.address);

      assert.equal(
        finalBuyerBalance.sub(initialBuyerBalance).toString(),
        expectedTokens,
        "购买的代币数量不正确"
      );
      assert.equal(
        initialContractBalance.sub(finalContractBalance).toString(),
        expectedTokens,
        "合约的代币减少量不正确"
      );
    });

    it("应该能够通过直接发送ETH购买代币", async () => {
      const ethAmount = web3.utils.toWei("0.5", "ether");
      const expectedTokens = web3.utils.toWei("1250", "ether"); // 0.5 ETH = 1250 JJC

      const initialBalance = await jjCoin.balanceOf(buyer);

      await web3.eth.sendTransaction({
        from: buyer,
        to: jjCoin.address,
        value: ethAmount
      });

      const finalBalance = await jjCoin.balanceOf(buyer);
      assert.equal(
        finalBalance.sub(initialBalance).toString(),
        expectedTokens,
        "通过发送ETH购买的代币数量不正确"
      );
    });

    it("应该正确计算代币数量", async () => {
      const ethAmount = web3.utils.toWei("2", "ether");
      const calculatedTokens = await jjCoin.calculateTokenAmount(ethAmount);
      const expectedTokens = web3.utils.toWei("5000", "ether"); // 2 ETH = 5000 JJC

      assert.equal(calculatedTokens.toString(), expectedTokens, "计算的代币数量不正确");
    });

    it("当合约代币余额不足时应该拒绝购买", async () => {
      // 先让owner取走合约中的大部分代币
      const contractBalance = await jjCoin.getContractTokenBalance();
      const withdrawAmount = contractBalance.sub(web3.utils.toWei("1000", "ether")); // 只留1000个代币
      await jjCoin.withdrawTokensFromContract(withdrawAmount, { from: owner });

      // 尝试购买超过剩余代币数量的代币
      const ethAmount = web3.utils.toWei("1", "ether"); // 想买2500个代币，但只剩1000个

      try {
        await jjCoin.buyTokens({ from: buyer, value: ethAmount });
        assert.fail("应该抛出异常");
      } catch (error) {
        assert(error.message.includes("Insufficient tokens in contract"), "错误信息不正确");
      }
    });
  });

  describe("增发功能测试", () => {
    it("owner应该能够增发代币到指定地址", async () => {
      const mintAmount = web3.utils.toWei("10000", "ether");
      const initialTotalSupply = await jjCoin.totalSupply();
      const initialRecipientBalance = await jjCoin.balanceOf(recipient);

      const tx = await jjCoin.mint(recipient, mintAmount, { from: owner });

      const finalTotalSupply = await jjCoin.totalSupply();
      const finalRecipientBalance = await jjCoin.balanceOf(recipient);

      // 验证总供应量增加
      assert.equal(
        finalTotalSupply.sub(initialTotalSupply).toString(),
        mintAmount,
        "总供应量增加不正确"
      );

      // 验证接收者余额增加
      assert.equal(
        finalRecipientBalance.sub(initialRecipientBalance).toString(),
        mintAmount,
        "接收者余额增加不正确"
      );

      // 验证事件
      const transferEvents = tx.logs.filter(log => log.event === "Transfer");
      const mintEvents = tx.logs.filter(log => log.event === "TokensMinted");

      assert.equal(transferEvents.length, 1, "应该触发一个Transfer事件");
      assert.equal(transferEvents[0].args.from, "0x0000000000000000000000000000000000000000", "Transfer事件from应该是零地址");
      assert.equal(transferEvents[0].args.to, recipient, "Transfer事件to地址不正确");
      assert.equal(transferEvents[0].args.value.toString(), mintAmount, "Transfer事件value不正确");

      assert.equal(mintEvents.length, 1, "应该触发一个TokensMinted事件");
      assert.equal(mintEvents[0].args.to, recipient, "TokensMinted事件to地址不正确");
      assert.equal(mintEvents[0].args.amount.toString(), mintAmount, "TokensMinted事件amount不正确");
    });

    it("owner应该能够向合约增发代币", async () => {
      const mintAmount = web3.utils.toWei("5000", "ether");
      const initialTotalSupply = await jjCoin.totalSupply();
      const initialContractBalance = await jjCoin.getContractTokenBalance();

      const tx = await jjCoin.mintToContract(mintAmount, { from: owner });

      const finalTotalSupply = await jjCoin.totalSupply();
      const finalContractBalance = await jjCoin.getContractTokenBalance();

      // 验证总供应量增加
      assert.equal(
        finalTotalSupply.sub(initialTotalSupply).toString(),
        mintAmount,
        "总供应量增加不正确"
      );

      // 验证合约余额增加
      assert.equal(
        finalContractBalance.sub(initialContractBalance).toString(),
        mintAmount,
        "合约余额增加不正确"
      );

      // 验证事件
      const transferEvents = tx.logs.filter(log => log.event === "Transfer");
      const mintEvents = tx.logs.filter(log => log.event === "TokensMinted");

      assert.equal(transferEvents.length, 1, "应该触发一个Transfer事件");
      assert.equal(transferEvents[0].args.from, "0x0000000000000000000000000000000000000000", "Transfer事件from应该是零地址");
      assert.equal(transferEvents[0].args.to, jjCoin.address, "Transfer事件to地址应该是合约地址");
    });

    it("owner应该能够批量增发代币", async () => {
      const recipients = [recipient, recipient2];
      const amounts = [web3.utils.toWei("3000", "ether"), web3.utils.toWei("2000", "ether")];
      const totalMintAmount = web3.utils.toBN(amounts[0]).add(web3.utils.toBN(amounts[1]));

      const initialTotalSupply = await jjCoin.totalSupply();
      const initialRecipientBalance = await jjCoin.balanceOf(recipient);
      const initialRecipient2Balance = await jjCoin.balanceOf(recipient2);

      const tx = await jjCoin.mintBatch(recipients, amounts, { from: owner });

      const finalTotalSupply = await jjCoin.totalSupply();
      const finalRecipientBalance = await jjCoin.balanceOf(recipient);
      const finalRecipient2Balance = await jjCoin.balanceOf(recipient2);

      // 验证总供应量增加
      assert.equal(
        finalTotalSupply.sub(initialTotalSupply).toString(),
        totalMintAmount.toString(),
        "总供应量增加不正确"
      );

      // 验证各接收者余额增加
      assert.equal(
        finalRecipientBalance.sub(initialRecipientBalance).toString(),
        amounts[0],
        "第一个接收者余额增加不正确"
      );
      assert.equal(
        finalRecipient2Balance.sub(initialRecipient2Balance).toString(),
        amounts[1],
        "第二个接收者余额增加不正确"
      );

      // 验证事件数量
      const transferEvents = tx.logs.filter(log => log.event === "Transfer");
      const mintEvents = tx.logs.filter(log => log.event === "TokensMinted");

      assert.equal(transferEvents.length, 2, "应该触发两个Transfer事件");
      assert.equal(mintEvents.length, 2, "应该触发两个TokensMinted事件");
    });

    it("非owner不能增发代币", async () => {
      const mintAmount = web3.utils.toWei("1000", "ether");

      try {
        await jjCoin.mint(recipient, mintAmount, { from: buyer });
        assert.fail("应该抛出异常");
      } catch (error) {
        assert(error.message.includes("Only owner can call this function"), "错误信息不正确");
      }
    });

    it("不能向零地址增发代币", async () => {
      const mintAmount = web3.utils.toWei("1000", "ether");

      try {
        await jjCoin.mint("0x0000000000000000000000000000000000000000", mintAmount, { from: owner });
        assert.fail("应该抛出异常");
      } catch (error) {
        assert(error.message.includes("Cannot mint to zero address"), "错误信息不正确");
      }
    });

    it("增发数量必须大于0", async () => {
      try {
        await jjCoin.mint(recipient, 0, { from: owner });
        assert.fail("应该抛出异常");
      } catch (error) {
        assert(error.message.includes("Mint amount must be greater than 0"), "错误信息不正确");
      }
    });

    it("批量增发时数组长度必须匹配", async () => {
      const recipients = [recipient, recipient2];
      const amounts = [web3.utils.toWei("1000", "ether")]; // 数组长度不匹配

      try {
        await jjCoin.mintBatch(recipients, amounts, { from: owner });
        assert.fail("应该抛出异常");
      } catch (error) {
        assert(error.message.includes("Arrays length mismatch"), "错误信息不正确");
      }
    });

    it("批量增发数组不能为空", async () => {
      try {
        await jjCoin.mintBatch([], [], { from: owner });
        assert.fail("应该抛出异常");
      } catch (error) {
        assert(error.message.includes("Empty arrays"), "错误信息不正确");
      }
    });
  });

  describe("管理员功能测试", () => {
    it("只有owner能够提取ETH", async () => {
      const ethAmount = web3.utils.toWei("1", "ether");
      
      // 先购买一些代币，让合约有ETH
      await jjCoin.buyTokens({ from: buyer, value: ethAmount });
      
      const contractBalance = await jjCoin.getContractBalance();
      assert.equal(contractBalance.toString(), ethAmount, "合约ETH余额不正确");
      
      // owner提取ETH - 简化测试，只检查合约余额变为0
      await jjCoin.withdrawETH({ from: owner });
      
      const finalContractBalance = await jjCoin.getContractBalance();
      assert.equal(finalContractBalance.toString(), "0", "提取后合约ETH余额应该为0");
    });

    it("非owner不能提取ETH", async () => {
      const ethAmount = web3.utils.toWei("1", "ether");
      await jjCoin.buyTokens({ from: buyer, value: ethAmount });
      
      try {
        await jjCoin.withdrawETH({ from: buyer });
        assert.fail("应该抛出异常");
      } catch (error) {
        assert(error.message.includes("Only owner can call this function"), "错误信息不正确");
      }
    });

    it("只有owner能够更新代币价格", async () => {
      const newPrice = web3.utils.toWei("0.001", "ether"); // 新价格
      
      await jjCoin.updateTokenPrice(newPrice, { from: owner });
      const updatedPrice = await jjCoin.getTokenPrice();
      
      assert.equal(updatedPrice.toString(), newPrice, "价格更新不正确");
    });

    it("非owner不能更新代币价格", async () => {
      const newPrice = web3.utils.toWei("0.001", "ether");
      
      try {
        await jjCoin.updateTokenPrice(newPrice, { from: buyer });
        assert.fail("应该抛出异常");
      } catch (error) {
        assert(error.message.includes("Only owner can call this function"), "错误信息不正确");
      }
    });

    it("owner可以向合约添加代币", async () => {
      const addAmount = web3.utils.toWei("1000", "ether");
      const initialOwnerBalance = await jjCoin.balanceOf(owner);
      const initialContractBalance = await jjCoin.getContractTokenBalance();

      await jjCoin.addTokensToContract(addAmount, { from: owner });

      const finalOwnerBalance = await jjCoin.balanceOf(owner);
      const finalContractBalance = await jjCoin.getContractTokenBalance();

      assert.equal(
        initialOwnerBalance.sub(finalOwnerBalance).toString(),
        addAmount,
        "owner余额减少量不正确"
      );
      assert.equal(
        finalContractBalance.sub(initialContractBalance).toString(),
        addAmount,
        "合约余额增加量不正确"
      );
    });

    it("owner可以从合约取回代币", async () => {
      const withdrawAmount = web3.utils.toWei("1000", "ether");
      const initialOwnerBalance = await jjCoin.balanceOf(owner);
      const initialContractBalance = await jjCoin.getContractTokenBalance();

      await jjCoin.withdrawTokensFromContract(withdrawAmount, { from: owner });

      const finalOwnerBalance = await jjCoin.balanceOf(owner);
      const finalContractBalance = await jjCoin.getContractTokenBalance();

      assert.equal(
        finalOwnerBalance.sub(initialOwnerBalance).toString(),
        withdrawAmount,
        "owner余额增加量不正确"
      );
      assert.equal(
        initialContractBalance.sub(finalContractBalance).toString(),
        withdrawAmount,
        "合约余额减少量不正确"
      );
    });
  });

  describe("事件测试", () => {
    it("购买代币时应该触发正确的事件", async () => {
      const ethAmount = web3.utils.toWei("1", "ether");
      const expectedTokens = web3.utils.toWei("2500", "ether");

      const tx = await jjCoin.buyTokens({ from: buyer, value: ethAmount });
      
      // 检查Transfer事件
      const transferEvents = tx.logs.filter(log => log.event === "Transfer");
      assert.equal(transferEvents.length, 1, "应该触发一个Transfer事件");
      assert.equal(transferEvents[0].args.from, jjCoin.address, "Transfer事件的from地址应该是合约地址");
      assert.equal(transferEvents[0].args.to, buyer, "Transfer事件的to地址不正确");
      assert.equal(transferEvents[0].args.value.toString(), expectedTokens, "Transfer事件的value不正确");

      // 检查TokensPurchased事件
      const purchaseEvents = tx.logs.filter(log => log.event === "TokensPurchased");
      assert.equal(purchaseEvents.length, 1, "应该触发一个TokensPurchased事件");
      assert.equal(purchaseEvents[0].args.buyer, buyer, "TokensPurchased事件的buyer不正确");
      assert.equal(purchaseEvents[0].args.ethAmount.toString(), ethAmount, "TokensPurchased事件的ethAmount不正确");
      assert.equal(purchaseEvents[0].args.tokenAmount.toString(), expectedTokens, "TokensPurchased事件的tokenAmount不正确");
    });

    it("初始化时应该触发正确的Transfer事件", async () => {
      // 创建新合约实例来检查构造函数事件
      const newJJCoin = await JJCoin.new({ from: owner });
      
      // 获取所有Transfer事件
      const transferEvents = await newJJCoin.getPastEvents('Transfer', {
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      assert.equal(transferEvents.length, 2, "应该有2个Transfer事件");
      
      // 检查第一个事件（owner分配）
      const ownerEvent = transferEvents[0];
      assert.equal(ownerEvent.returnValues.from, "0x0000000000000000000000000000000000000000", "第一个事件from应该是零地址");
      assert.equal(ownerEvent.returnValues.to, owner, "第一个事件to应该是owner");
      
      // 检查第二个事件（合约分配）
      const contractEvent = transferEvents[1];
      assert.equal(contractEvent.returnValues.from, "0x0000000000000000000000000000000000000000", "第二个事件from应该是零地址");
      assert.equal(contractEvent.returnValues.to, newJJCoin.address, "第二个事件to应该是合约地址");
    });
  });
}); 