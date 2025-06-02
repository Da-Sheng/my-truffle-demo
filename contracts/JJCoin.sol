// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.22 <0.9.0;

contract JJCoin {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    address public owner;
    uint256 public tokenPrice; // 每个代币的价格，以wei为单位

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    event TokensMinted(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        name = "JJCoin";
        symbol = "JJC";
        decimals = 18;
        totalSupply = 210000 * 10**decimals; // 21万个代币
        owner = msg.sender;
        
        // 1 ETH = 2500 JJCoin，所以1个代币 = 1 ETH / 2500
        tokenPrice = 1 ether / 2500; // 每个代币的价格
        
        // 代币分配：一半给owner，一半保留在合约中用于市场流通
        uint256 ownerShare = totalSupply / 2; // 105,000 JJC给owner
        uint256 contractShare = totalSupply - ownerShare; // 105,000 JJC保留在合约中
        
        balanceOf[msg.sender] = ownerShare;
        balanceOf[address(this)] = contractShare;
        
        // 触发转账事件
        emit Transfer(address(0), msg.sender, ownerShare);
        emit Transfer(address(0), address(this), contractShare);
    }

    // ERC20标准函数实现
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Cannot transfer to zero address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }

    // 代币购买功能 - 现在从合约余额中出售
    function buyTokens() public payable {
        require(msg.value > 0, "ETH amount must be greater than 0");
        
        uint256 tokenAmount = (msg.value * 10**decimals) / tokenPrice;
        require(balanceOf[address(this)] >= tokenAmount, "Insufficient tokens in contract");
        
        // 从合约账户转移代币到买家
        balanceOf[address(this)] -= tokenAmount;
        balanceOf[msg.sender] += tokenAmount;
        
        emit Transfer(address(this), msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    // 增发代币到指定地址（只有owner可以调用）
    function mint(address _to, uint256 _amount) public onlyOwner {
        require(_to != address(0), "Cannot mint to zero address");
        require(_amount > 0, "Mint amount must be greater than 0");
        
        totalSupply += _amount;
        balanceOf[_to] += _amount;
        
        emit Transfer(address(0), _to, _amount);
        emit TokensMinted(_to, _amount);
    }

    // 增发代币到合约地址用于市场流通（只有owner可以调用）
    function mintToContract(uint256 _amount) public onlyOwner {
        require(_amount > 0, "Mint amount must be greater than 0");
        
        totalSupply += _amount;
        balanceOf[address(this)] += _amount;
        
        emit Transfer(address(0), address(this), _amount);
        emit TokensMinted(address(this), _amount);
    }

    // 批量增发到多个地址（只有owner可以调用）
    function mintBatch(address[] memory _recipients, uint256[] memory _amounts) public onlyOwner {
        require(_recipients.length == _amounts.length, "Arrays length mismatch");
        require(_recipients.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Cannot mint to zero address");
            require(_amounts[i] > 0, "Mint amount must be greater than 0");
            
            totalSupply += _amounts[i];
            balanceOf[_recipients[i]] += _amounts[i];
            
            emit Transfer(address(0), _recipients[i], _amounts[i]);
            emit TokensMinted(_recipients[i], _amounts[i]);
        }
    }

    // 获取代币价格（以wei为单位）
    function getTokenPrice() public view returns (uint256) {
        return tokenPrice;
    }

    // 计算指定ETH数量可以购买的代币数量
    function calculateTokenAmount(uint256 _ethAmount) public view returns (uint256) {
        return (_ethAmount * 10**decimals) / tokenPrice;
    }

    // owner提取合约中的ETH
    function withdrawETH() public onlyOwner {
        require(address(this).balance > 0, "No ETH to withdraw");
        payable(owner).transfer(address(this).balance);
    }

    // 更新代币价格（只有owner可以调用）
    function updateTokenPrice(uint256 _newPrice) public onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        tokenPrice = _newPrice;
    }

    // 查看合约ETH余额
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // 查看合约代币余额（可用于出售的代币数量）
    function getContractTokenBalance() public view returns (uint256) {
        return balanceOf[address(this)];
    }

    // owner可以向合约添加更多代币用于出售
    function addTokensToContract(uint256 _amount) public onlyOwner {
        require(balanceOf[msg.sender] >= _amount, "Insufficient owner balance");
        
        balanceOf[msg.sender] -= _amount;
        balanceOf[address(this)] += _amount;
        
        emit Transfer(msg.sender, address(this), _amount);
    }

    // owner可以从合约中取回代币
    function withdrawTokensFromContract(uint256 _amount) public onlyOwner {
        require(balanceOf[address(this)] >= _amount, "Insufficient contract balance");
        
        balanceOf[address(this)] -= _amount;
        balanceOf[msg.sender] += _amount;
        
        emit Transfer(address(this), msg.sender, _amount);
    }

    function isOwner() public view returns (bool) {
        return msg.sender == owner;
    }

    // 接收ETH的回退函数
    receive() external payable {
        buyTokens();
    }

    fallback() external payable {
        buyTokens();
    }
}
