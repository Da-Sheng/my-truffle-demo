// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract JJTicket {
    // 状态变量
    address public owner;
    IERC20 public jjCoin;
    uint256 public ticketPrice;
    uint256 public totalTickets;
    uint256 public soldTickets;
    
    // hash相关数据结构
    struct TicketHash {
        bytes32 hashValue;
        address buyer;
        uint256 purchaseTime;
        bool isUsed;
        bool exists;
    }
    
    // 存储映射
    mapping(bytes32 => TicketHash) public ticketHashes;
    mapping(address => bytes32[]) public buyerHashes;
    bytes32[] public allHashes;
    
    // 事件定义
    event TicketPurchased(
        address indexed buyer,
        bytes32 indexed ticketHash,
        uint256 price,
        uint256 timestamp
    );
    
    event HashAdded(
        bytes32 indexed hashValue,
        uint256 timestamp
    );
    
    event HashUsed(
        bytes32 indexed hashValue,
        address indexed buyer,
        uint256 timestamp
    );
    
    event PriceUpdated(
        uint256 oldPrice,
        uint256 newPrice,
        uint256 timestamp
    );
    
    // 修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validHash(bytes32 _hash) {
        require(ticketHashes[_hash].exists, "Hash does not exist");
        require(!ticketHashes[_hash].isUsed, "Hash already used");
        _;
    }
    
    modifier hasAvailableTickets() {
        require(soldTickets < totalTickets, "No tickets available");
        _;
    }
    
    // 构造函数
    constructor(
        address _jjCoinAddress,
        uint256 _ticketPrice,
        uint256 _totalTickets
    ) {
        owner = msg.sender;
        jjCoin = IERC20(_jjCoinAddress);
        ticketPrice = _ticketPrice;
        totalTickets = _totalTickets;
        soldTickets = 0;
    }
    
    // 管理员功能：批量添加hash
    function addTicketHashes(bytes32[] calldata _hashes) external onlyOwner {
        for (uint256 i = 0; i < _hashes.length; i++) {
            require(!ticketHashes[_hashes[i]].exists, "Hash already exists");
            
            ticketHashes[_hashes[i]] = TicketHash({
                hashValue: _hashes[i],
                buyer: address(0),
                purchaseTime: 0,
                isUsed: false,
                exists: true
            });
            
            allHashes.push(_hashes[i]);
            emit HashAdded(_hashes[i], block.timestamp);
        }
    }
    
    // 核心功能：购买门票hash
    function purchaseTicket(bytes32 _desiredHash) external hasAvailableTickets validHash(_desiredHash) {
        require(ticketHashes[_desiredHash].buyer == address(0), "Hash already purchased");
        
        // 检查买方JJCoin余额
        require(jjCoin.balanceOf(msg.sender) >= ticketPrice, "Insufficient JJCoin balance");
        
        // 转账JJCoin到合约
        require(jjCoin.transferFrom(msg.sender, address(this), ticketPrice), "JJCoin transfer failed");
        
        // 更新hash状态
        ticketHashes[_desiredHash].buyer = msg.sender;
        ticketHashes[_desiredHash].purchaseTime = block.timestamp;
        
        // 记录买家购买历史
        buyerHashes[msg.sender].push(_desiredHash);
        
        // 更新售票计数
        soldTickets++;
        
        // 触发事件
        emit TicketPurchased(msg.sender, _desiredHash, ticketPrice, block.timestamp);
    }
    
    // 随机购买功能（如果用户不指定特定hash）
    function purchaseRandomTicket() external hasAvailableTickets returns (bytes32) {
        require(jjCoin.balanceOf(msg.sender) >= ticketPrice, "Insufficient JJCoin balance");
        
        // 找到第一个可用的hash
        bytes32 availableHash;
        bool found = false;
        
        for (uint256 i = 0; i < allHashes.length; i++) {
            if (ticketHashes[allHashes[i]].exists && 
                ticketHashes[allHashes[i]].buyer == address(0)) {
                availableHash = allHashes[i];
                found = true;
                break;
            }
        }
        
        require(found, "No available tickets");
        
        // 执行购买
        require(jjCoin.transferFrom(msg.sender, address(this), ticketPrice), "JJCoin transfer failed");
        
        ticketHashes[availableHash].buyer = msg.sender;
        ticketHashes[availableHash].purchaseTime = block.timestamp;
        buyerHashes[msg.sender].push(availableHash);
        soldTickets++;
        
        emit TicketPurchased(msg.sender, availableHash, ticketPrice, block.timestamp);
        
        return availableHash;
    }
    
    // Web2系统验证功能：标记hash已使用
    function markHashAsUsed(bytes32 _hash) external onlyOwner validHash(_hash) {
        require(ticketHashes[_hash].buyer != address(0), "Hash not purchased yet");
        
        ticketHashes[_hash].isUsed = true;
        emit HashUsed(_hash, ticketHashes[_hash].buyer, block.timestamp);
    }
    
    // 查询功能
    function getTicketInfo(bytes32 _hash) external view returns (
        address buyer,
        uint256 purchaseTime,
        bool isUsed,
        bool exists
    ) {
        TicketHash memory ticket = ticketHashes[_hash];
        return (ticket.buyer, ticket.purchaseTime, ticket.isUsed, ticket.exists);
    }
    
    function getBuyerHashes(address _buyer) external view returns (bytes32[] memory) {
        return buyerHashes[_buyer];
    }
    
    function getAvailableTicketsCount() external view returns (uint256) {
        return totalTickets - soldTickets;
    }
    
    function getAllHashes() external view returns (bytes32[] memory) {
        return allHashes;
    }
    
    // 验证hash是否有效且已购买（供web2系统调用）
    function verifyTicketHash(bytes32 _hash, address _buyer) external view returns (bool) {
        return ticketHashes[_hash].exists && 
               ticketHashes[_hash].buyer == _buyer && 
               !ticketHashes[_hash].isUsed;
    }
    
    // 管理员功能
    function updateTicketPrice(uint256 _newPrice) external onlyOwner {
        uint256 oldPrice = ticketPrice;
        ticketPrice = _newPrice;
        emit PriceUpdated(oldPrice, _newPrice, block.timestamp);
    }
    
    function updateTotalTickets(uint256 _newTotal) external onlyOwner {
        require(_newTotal >= soldTickets, "Cannot set total less than sold tickets");
        totalTickets = _newTotal;
    }
    
    function withdrawJJCoin(uint256 _amount) external onlyOwner {
        require(jjCoin.transfer(owner, _amount), "Withdrawal failed");
    }
    
    // 紧急功能：暂停合约（可以扩展）
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}

