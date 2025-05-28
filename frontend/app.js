// IOC 合约交互应用
class WalletApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAccount = null;
        
        // 合约配置 - 请替换为您部署的合约地址
        this.contractAddress = "0xAA9DEd3EED487899d208D2f255DeD91c7f56D61F";
        this.contractABI = [
            {
                "inputs": [],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "CollectEth",
                "type": "event"
            },
            {
                "inputs": [],
                "name": "balance",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "collectEth",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getBalance",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getOwner",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "name",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "_to",
                        "type": "address"
                    }
                ],
                "name": "withdraw",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];
        
        this.init();
    }
    
    async init() {
        // 检查MetaMask是否可用
        if (typeof window.ethereum === 'undefined') {
            this.showError('请安装MetaMask钱包！');
            return;
        }
        
        // 绑定事件
        this.bindEvents();
        
        // 自动连接已连接的账户
        await this.checkConnection();
        
        // 初始化界面状态
        this.updateContractStatus();
    }
    
    bindEvents() {
        $('#connect-wallet').on('click', () => this.connectWallet());
        $('#disconnect-wallet').on('click', () => this.confirmDisconnect());
        $('#set-contract').on('click', () => this.setContract());
        $('#collect').on('click', () => this.collectEth());
        $('#withdraw').on('click', () => this.withdrawEth());
        $('#refresh-balance').on('click', () => this.updateBalance());
        $('#check-permission').on('click', () => this.checkPermission());
        $('#debug-ownership').on('click', () => this.debugOwnershipCheck());
        
        // 监听账户变化
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.userAccount = accounts[0];
                    this.updateUI();
                }
            });
            
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }
    
    async checkConnection() {
        try {
            // 检查用户是否主动断开了连接
            const userDisconnected = localStorage.getItem('walletDisconnected');
            if (userDisconnected === 'true') {
                console.log('用户已主动断开连接，跳过自动连接');
                return;
            }
            
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await this.connectWallet();
            }
        } catch (error) {
            console.log('检查连接状态失败:', error);
        }
    }
    
    async connectWallet() {
        try {
            // 请求连接钱包
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length === 0) {
                throw new Error('未选择账户');
            }
            
            // 清除断开连接的标记
            localStorage.removeItem('walletDisconnected');
            
            // 初始化provider和signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.userAccount = accounts[0];
            
            // 如果已有合约地址，初始化合约实例
            await this.initContract();
            
            this.showSuccess('钱包连接成功！');
            this.updateUI();
            
        } catch (error) {
            this.showError('连接钱包失败: ' + error.message);
        }
    }
    
    async setContract() {
        const contractAddress = $('#contract-address').val().trim();
        
        if (!contractAddress) {
            this.showError('请输入合约地址');
            return;
        }
        
        if (!ethers.isAddress(contractAddress)) {
            this.showError('请输入有效的合约地址');
            return;
        }
        
        this.contractAddress = contractAddress;
        
        // 如果钱包已连接，初始化合约
        if (this.signer) {
            await this.initContract();
        }
        
        this.updateContractStatus();
        this.showSuccess('合约地址设置成功！');
    }
    
    async initContract() {
        if (!this.signer || !this.contractAddress || this.contractAddress === "YOUR_CONTRACT_ADDRESS_HERE") {
            return;
        }
        
        try {
            this.contract = new ethers.Contract(
                this.contractAddress,
                this.contractABI,
                this.signer
            );
            
            // 测试合约连接
            await this.contract.name();
            
            // 监听合约事件
            this.setupEventListeners();
            
            this.updateContractStatus();
            
        } catch (error) {
            this.showError('合约初始化失败: ' + error.message);
            this.contract = null;
        }
    }
    
    confirmDisconnect() {
        // 创建自定义确认对话框
        const modal = $(`
            <div id="disconnect-confirm-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    max-width: 450px;
                    margin: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <h3 style="margin-bottom: 20px; color: #333; text-align: center;">选择断开连接方式</h3>
                    <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">
                        请选择断开连接的方式：
                    </p>
                    <div style="margin-bottom: 20px;">
                        <button id="normal-disconnect" style="
                            width: 100%;
                            background: #2196F3;
                            color: white;
                            border: none;
                            padding: 15px;
                            border-radius: 8px;
                            cursor: pointer;
                            margin-bottom: 10px;
                            font-size: 14px;
                        ">
                            🔒 常规断开连接
                            <br><small style="opacity: 0.8;">撤销网站权限，保留钱包数据</small>
                        </button>
                        <button id="force-disconnect" style="
                            width: 100%;
                            background: #f44336;
                            color: white;
                            border: none;
                            padding: 15px;
                            border-radius: 8px;
                            cursor: pointer;
                            margin-bottom: 10px;
                            font-size: 14px;
                        ">
                            💥 强力断开连接
                            <br><small style="opacity: 0.8;">清除所有缓存，彻底断开</small>
                        </button>
                        <button id="cancel-disconnect" style="
                            width: 100%;
                            background: #ccc;
                            color: #333;
                            border: none;
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                        ">
                            取消
                        </button>
                    </div>
                </div>
            </div>
        `);
        
        $('body').append(modal);
        
        // 绑定事件
        $('#normal-disconnect').on('click', () => {
            $('#disconnect-confirm-modal').remove();
            this.disconnect();
        });
        
        $('#force-disconnect').on('click', () => {
            $('#disconnect-confirm-modal').remove();
            this.forceDisconnect();
        });
        
        $('#cancel-disconnect').on('click', () => {
            $('#disconnect-confirm-modal').remove();
        });
        
        // 点击外部区域取消
        $('#disconnect-confirm-modal').on('click', (e) => {
            if (e.target.id === 'disconnect-confirm-modal') {
                $('#disconnect-confirm-modal').remove();
            }
        });
    }
    
    async disconnect() {
        try {
            // 方法1: 尝试撤销网站权限（新版MetaMask支持）
            if (window.ethereum && window.ethereum.request) {
                try {
                    // 撤销所有权限
                    await window.ethereum.request({
                        method: 'wallet_revokePermissions',
                        params: [{ eth_accounts: {} }]
                    });
                    console.log('✅ 成功撤销MetaMask权限');
                } catch (revokeError) {
                    console.log('⚠️ 权限撤销失败（可能是MetaMask版本不支持）:', revokeError.message);
                    
                    // 方法2: 强制重新请求权限来清除连接
                    try {
                        await window.ethereum.request({
                            method: 'wallet_requestPermissions',
                            params: [{ eth_accounts: {} }]
                        });
                        // 如果用户取消授权，就达到了断开的效果
                    } catch (permError) {
                        console.log('用户取消了重新授权，连接已断开');
                    }
                }
            }
            
            // 方法3: 清理所有可能的缓存和状态
            if (window.ethereum) {
                // 移除所有事件监听器
                try {
                    window.ethereum.removeAllListeners('accountsChanged');
                    window.ethereum.removeAllListeners('chainChanged');
                    window.ethereum.removeAllListeners('connect');
                    window.ethereum.removeAllListeners('disconnect');
                } catch (error) {
                    console.log('清理事件监听器时出错:', error);
                }
            }
            
        } catch (error) {
            console.log('API断开连接过程中出错:', error);
        }
        
        // 设置断开连接标记，防止刷新后自动重连
        localStorage.setItem('walletDisconnected', 'true');
        
        // 清理前端状态
        this.cleanupFrontendState();
        
        // 显示断开连接指导
        this.showDisconnectionGuidance();
    }
    
    cleanupFrontendState() {
        // 清理合约事件监听器
        if (this.contract) {
            this.contract.removeAllListeners();
        }
        
        // 重置所有状态
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAccount = null;
        
        // 清理输入框
        $('#collect-amount').val('');
        $('#withdraw-amount').val('');
        $('#withdraw-address').val('');
        
        // 更新界面
        this.updateUI();
    }
    
    showDisconnectionGuidance() {
        const guidanceMessage = `
🔒 钱包连接已断开

如果您仍然看到自动连接，请按以下步骤彻底断开：

1. 🦊 打开MetaMask插件
2. ⚙️ 点击右上角设置图标
3. 🔗 选择"已连接的网站"
4. 🚫 找到当前网站并点击"断开连接"
5. 🔄 刷新页面验证

这样可以彻底清除MetaMask对该网站的授权记录。
        `;
        
        // 确保先移除可能存在的旧弹框
        $('#disconnect-modal').remove();
        
        // 创建一个更持久的提示
        const modal = $(`
            <div id="disconnect-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    max-width: 500px;
                    margin: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <h3 style="margin-bottom: 20px; color: #333;">钱包断开连接指导</h3>
                    <pre style="
                        white-space: pre-wrap;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        font-family: Arial, sans-serif;
                        line-height: 1.5;
                        margin: 20px 0;
                    ">${guidanceMessage}</pre>
                    <div style="text-align: center; margin-top: 20px;">
                        <button id="close-guidance" class="btn" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                        ">我知道了</button>
                    </div>
                </div>
            </div>
        `);
        
        $('body').append(modal);
        
        // 使用更安全的事件绑定方式
        $(document).on('click', '#close-guidance', () => {
            $('#disconnect-modal').remove();
        });
        
        // 点击外部区域关闭
        $(document).on('click', '#disconnect-modal', (e) => {
            if (e.target.id === 'disconnect-modal') {
                $('#disconnect-modal').remove();
            }
        });
        
        // 15秒后自动关闭
        setTimeout(() => {
            $('#disconnect-modal').remove();
        }, 15000);
    }
    
    async collectEth() {
        if (!this.contract) {
            this.showError('请先连接钱包并设置合约地址');
            return;
        }
        
        try {
            const amount = $('#collect-amount').val();
            if (!amount || parseFloat(amount) <= 0) {
                this.showError('请输入有效的ETH数量');
                return;
            }
            
            this.showInfo('正在发送交易...');
            
            const tx = await this.contract.collectEth({
                value: ethers.parseEther(amount)
            });
            
            this.showInfo('交易已发送，等待确认...');
            const receipt = await tx.wait();
            
            this.showSuccess(`交易成功！交易哈希: ${receipt.hash}`);
            await this.updateBalance();
            
        } catch (error) {
            this.showError('Collect失败: ' + error.message);
        }
    }
    
    async withdrawEth() {
        if (!this.contract) {
            this.showError('请先连接钱包并设置合约地址');
            return;
        }
        
        try {
            const amount = $('#withdraw-amount').val();
            const toAddress = $('#withdraw-address').val();
            
            if (!amount || parseFloat(amount) <= 0) {
                this.showError('请输入有效的ETH数量');
                return;
            }
            
            if (!ethers.isAddress(toAddress)) {
                this.showError('请输入有效的接收地址');
                return;
            }
            
            // 预检查：验证合约余额
            const contractBalance = await this.contract.getBalance();
            const withdrawAmount = ethers.parseEther(amount);
            
            if (withdrawAmount > contractBalance) {
                this.showError(`合约余额不足！当前余额: ${ethers.formatEther(contractBalance)} ETH，请求提取: ${amount} ETH`);
                return;
            }
            
            // 预检查：尝试估算gas（这会触发合约的require检查）
            this.showInfo('正在验证交易权限...');
            
            try {
                await this.contract.withdraw.estimateGas(withdrawAmount, toAddress);
            } catch (estimateError) {
                // 解析估算错误
                if (estimateError.message.includes('not owner') || 
                    estimateError.message.includes('missing revert data')) {
                    this.showError('提取失败：您不是合约的所有者。只有部署合约的账户才能进行提取操作。');
                    return;
                } else if (estimateError.message.includes('Not enough ETH')) {
                    this.showError('提取失败：合约余额不足');
                    return;
                } else {
                    this.showError('预检查失败: ' + estimateError.message);
                    return;
                }
            }
            
            this.showInfo('正在发送交易...');
            
            const tx = await this.contract.withdraw(withdrawAmount, toAddress);
            
            this.showInfo('交易已发送，等待确认...');
            const receipt = await tx.wait();
            
            this.showSuccess(`提取成功！交易哈希: ${receipt.hash}`);
            await this.updateBalance();
            
        } catch (error) {
            // 解析不同类型的错误
            let errorMessage = 'Withdraw失败: ';
            
            if (error.message.includes('not owner')) {
                errorMessage += '您不是合约所有者';
            } else if (error.message.includes('Not enough ETH')) {
                errorMessage += '合约余额不足';
            } else if (error.message.includes('missing revert data')) {
                errorMessage += '权限验证失败，请确认您是合约所有者';
            } else if (error.message.includes('user rejected')) {
                errorMessage += '用户取消了交易';
            } else {
                errorMessage += error.message;
            }
            
            this.showError(errorMessage);
        }
    }
    
    async updateBalance() {
        if (!this.contract) {
            $('#balance').text('0 ETH');
            return;
        }
        
        try {
            const balance = await this.contract.getBalance();
            const balanceInEth = ethers.formatEther(balance);
            $('#balance').text(`${balanceInEth} ETH`);
            
            // 更新用户账户余额
            if (this.provider && this.userAccount) {
                const userBalance = await this.provider.getBalance(this.userAccount);
                const userBalanceInEth = ethers.formatEther(userBalance);
                $('#user-balance').text(`${parseFloat(userBalanceInEth).toFixed(4)} ETH`);
            }
            
        } catch (error) {
            console.error('更新余额失败:', error);
            $('#balance').text('获取失败');
        }
    }
    
    // 详细的合约所有者调试检查
    async debugOwnershipCheck() {
        if (!this.contract || !this.userAccount) {
            this.showError('请先连接钱包并设置合约');
            return;
        }

        try {
            this.showInfo('🔍 开始详细权限调试...');
            
            // 1. 检查合约是否存在owner getter
            console.log('📋 调试信息汇总:');
            console.log('当前连接账户:', this.userAccount);
            console.log('合约地址:', this.contractAddress);
            
            // 2. 尝试获取合约的owner地址（如果有public getter）
            let contractOwner = null;
            try {
                // 使用getOwner方法获取合约所有者
                contractOwner = await this.contract.getOwner();
                console.log('合约所有者地址:', contractOwner);
            } catch (error) {
                console.log('❌ 无法获取合约所有者:', error.message);
            }
            
            // 3. 检查网络信息
            const network = await this.provider.getNetwork();
            console.log('当前网络:', network.name, '链ID:', network.chainId);
            
            // 4. 检查合约代码
            const code = await this.provider.getCode(this.contractAddress);
            if (code === '0x') {
                console.log('❌ 合约地址上没有部署代码');
                this.showError('错误：合约地址上没有部署代码！请检查合约地址和网络。');
                return;
            } else {
                console.log('✅ 合约代码存在');
            }
            
            // 5. 尝试权限测试（使用极小金额）
            try {
                const testAmount = ethers.parseEther('0.000000000000000001'); // 极小金额
                await this.contract.withdraw.estimateGas(testAmount, this.userAccount);
                
                if (contractOwner) {
                    const isOwner = this.userAccount.toLowerCase() === contractOwner.toLowerCase();
                    console.log('✅ 权限检查通过 - 您是合约所有者');
                    console.log('地址匹配:', isOwner);
                } else {
                    console.log('✅ 权限检查通过 - 您是合约所有者（无法获取owner地址确认）');
                }
                
                this.showSuccess('调试完成：您确实是合约所有者！');
                
            } catch (error) {
                console.log('❌ 权限检查失败:', error.message);
                
                if (contractOwner) {
                    const isOwner = this.userAccount.toLowerCase() === contractOwner.toLowerCase();
                    console.log('地址比较结果:');
                    console.log('当前账户:', this.userAccount.toLowerCase());
                    console.log('合约所有者:', contractOwner.toLowerCase());
                    console.log('是否匹配:', isOwner);
                    
                    if (!isOwner) {
                        this.showError(`调试结果：您不是合约所有者\n当前账户: ${this.userAccount}\n合约所有者: ${contractOwner}`);
                    } else {
                        this.showError('调试异常：地址匹配但权限检查失败，可能是网络或合约状态问题');
                    }
                } else {
                    this.showError('调试结果：权限检查失败，无法获取合约所有者信息');
                }
            }
            
            // 6. 显示建议
            console.log('\n💡 排查建议:');
            console.log('1. 确认您使用的是部署合约时的同一个账户');
            console.log('2. 确认您连接的是合约部署时的同一个网络');
            console.log('3. 确认合约地址是否正确');
            console.log('4. 检查是否切换了MetaMask账户');
            
        } catch (error) {
            console.error('调试过程出错:', error);
            this.showError('调试失败: ' + error.message);
        }
    }

    async checkPermission() {
        if (!this.contract || !this.userAccount) {
            this.showError('请先连接钱包并设置合约');
            return;
        }
        
        $('#permission-status').show();
        $('#owner-status').text('检查中...').removeClass('owner not-owner');
        
        try {
            // 尝试调用一个需要owner权限的函数进行测试
            // 我们用estimateGas来测试，不会实际执行交易
            await this.contract.withdraw.estimateGas(
                ethers.parseEther('0.000001'), // 很小的金额
                this.userAccount // 提取到自己的地址
            );
            
            // 如果没有抛出错误，说明有owner权限
            $('#owner-status').text('✅ 是合约所有者').addClass('owner');
            this.showSuccess('权限检查完成：您是合约所有者，可以进行提取操作');
            
        } catch (error) {
            if (error.message.includes('not owner') || 
                error.message.includes('missing revert data')) {
                $('#owner-status').text('❌ 非合约所有者').addClass('not-owner');
                this.showInfo('权限检查完成：您不是合约所有者，无法进行提取操作');
            } else if (error.message.includes('Not enough ETH')) {
                // 如果是余额不足错误，说明权限检查通过了
                $('#owner-status').text('✅ 是合约所有者').addClass('owner');
                this.showSuccess('权限检查完成：您是合约所有者（但合约余额不足）');
            } else {
                $('#owner-status').text('❓ 检查失败').removeClass('owner not-owner');
                this.showError('权限检查失败: ' + error.message);
            }
        }
    }
    
    setupEventListeners() {
        if (!this.contract) return;
        
        // 监听CollectEth事件
        this.contract.on('CollectEth', (name, amount, event) => {
            const amountInEth = ethers.formatEther(amount);
            this.showSuccess(`收到 ${name} 事件: ${amountInEth} ETH`);
            this.updateBalance();
        });
    }
    
    updateContractStatus() {
        const statusEl = $('#contract-status');
        const statusTextEl = statusEl.find('.status-text');
        
        if (this.contract && this.contractAddress !== "YOUR_CONTRACT_ADDRESS_HERE") {
            statusEl.addClass('connected');
            statusTextEl.text(`合约已连接: ${this.contractAddress.slice(0, 6)}...${this.contractAddress.slice(-4)}`);
        } else {
            statusEl.removeClass('connected');
            statusTextEl.text('未设置合约');
        }
    }
    
    updateUI() {
        if (this.userAccount) {
            $('#wallet-status').removeClass('disconnected').addClass('connected');
            $('#status-indicator').addClass('connected');
            $('#wallet-address').text(`${this.userAccount.slice(0, 6)}...${this.userAccount.slice(-4)}`);
            $('#connect-wallet').hide();
            $('#disconnect-wallet').show();
            $('.wallet-actions').show();
            this.updateBalance();
        } else {
            $('#wallet-status').removeClass('connected').addClass('disconnected');
            $('#status-indicator').removeClass('connected');
            $('#wallet-address').text('未连接');
            $('#connect-wallet').show();
            $('#disconnect-wallet').hide();
            $('.wallet-actions').hide();
            $('#balance').text('0 ETH');
            $('#user-balance').text('0 ETH');
            $('#permission-status').hide();
        }
        
        // 更新合约状态
        this.updateContractStatus();
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showInfo(message) {
        this.showMessage(message, 'info');
    }
    
    showMessage(message, type) {
        const messageEl = $('#message');
        messageEl.removeClass('success error info').addClass(type);
        messageEl.text(message).show();
        
        // 3秒后自动隐藏
        setTimeout(() => {
            messageEl.hide();
        }, 3000);
    }

    // 强力断开连接 - 清除所有可能的缓存
    async forceDisconnect() {
        try {
            // 1. 清除localStorage中所有相关数据
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('metamask') || key.includes('wallet') || key.includes('ethereum'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // 2. 清除sessionStorage中相关数据
            const sessionKeysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('metamask') || key.includes('wallet') || key.includes('ethereum'))) {
                    sessionKeysToRemove.push(key);
                }
            }
            sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
            
            // 3. 清除IndexedDB中可能的钱包数据
            if ('indexedDB' in window) {
                try {
                    const dbs = await indexedDB.databases();
                    for (const db of dbs) {
                        if (db.name && (db.name.includes('metamask') || db.name.includes('wallet'))) {
                            indexedDB.deleteDatabase(db.name);
                        }
                    }
                } catch (error) {
                    console.log('清理IndexedDB时出错:', error);
                }
            }
            
            // 4. 尝试重置ethereum provider
            if (window.ethereum) {
                try {
                    // 强制重新初始化连接状态
                    await window.ethereum.request({ method: 'eth_accounts' });
                } catch (error) {
                    console.log('重置provider时出错:', error);
                }
            }
            
            console.log('✅ 强力断开连接完成，已清除所有缓存');
            
        } catch (error) {
            console.log('强力断开连接时出错:', error);
        }
        
        // 执行常规断开连接流程
        await this.disconnect();
    }
}

// 页面加载完成后初始化应用
$(document).ready(() => {
    window.walletApp = new WalletApp();
}); 