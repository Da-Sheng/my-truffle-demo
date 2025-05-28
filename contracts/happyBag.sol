// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.22 <0.9.0;

contract HappyBag {
    // ... 基础变量 ...
    mapping(uint256 => mapping(address => uint256)) public claimedInfo; // 记录领取金额
    
    // 记录每轮红包的详细信息
    struct BagInfo {
        uint256 totalAmount;
        uint256 totalCount;
        uint256 remainingCount;
        uint256 remainingAmount;  // 剩余金额
        uint256 startTime;
        address creator;          // 创建者地址
        bool isActive;
        bool isEqual;
    }
    
    mapping(uint256 => BagInfo) public bagHistory;
    uint256 public currentBagId;  // 当前活跃的bagId (hash值)
    uint256 private nonce;        // 用于生成唯一hash的计数器

    // 生成唯一的bag ID
    function _generateBagId() private returns (uint256) {
        nonce++;
        uint256 bagId = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            nonce,
            block.prevrandao
        )));
        
        // 确保ID唯一性（虽然碰撞概率极低）
        while(bagHistory[bagId].startTime != 0) {
            nonce++;
            bagId = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                msg.sender,
                nonce,
                block.prevrandao
            )));
        }
        
        return bagId;
    }

    function initBag(uint256 count, bool isEqual) public payable {
        require(count > 0, "Invalid count number of bags !");
        
        // 检查上一轮是否结束
        if (currentBagId != 0) {
            require(!bagHistory[currentBagId].isActive, "Last bag is still active");
        }
        
        // 生成新的bag ID
        currentBagId = _generateBagId();
        
        // 记录新轮次信息
        bagHistory[currentBagId] = BagInfo({
            totalAmount: msg.value,
            totalCount: count,
            remainingCount: count,
            remainingAmount: msg.value,
            startTime: block.timestamp,
            creator: msg.sender,
            isActive: true,
            isEqual: isEqual
        });
        
        emit BagCreated(currentBagId, msg.sender, msg.value, count, isEqual);
    }

    function claim() public {
        require(currentBagId != 0, "No bag available");
        require(bagHistory[currentBagId].isActive, "No active bag");
        require(claimedInfo[currentBagId][msg.sender] == 0, "Already claimed!");
        require(bagHistory[currentBagId].remainingCount > 0, "No bags left!");
        
        uint256 reward;
        
        // 如果是最后一个红包，直接分配剩余金额
        if(bagHistory[currentBagId].remainingCount == 1) {
            reward = bagHistory[currentBagId].remainingAmount;
        } else {
            // 红包分发逻辑
            if(bagHistory[currentBagId].isEqual){
                // 平均分配
                reward = bagHistory[currentBagId].totalAmount / bagHistory[currentBagId].totalCount;
            } else {
                // 随机分配
                uint256 avgAmount = bagHistory[currentBagId].remainingAmount / bagHistory[currentBagId].remainingCount;
                uint256 maxAmount = avgAmount * 2; // 最大为平均值的2倍
                if(maxAmount > bagHistory[currentBagId].remainingAmount) {
                    maxAmount = bagHistory[currentBagId].remainingAmount;
                }
                
                // 生成随机数
                uint256 randomSeed = uint256(keccak256(abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    bagHistory[currentBagId].remainingCount,
                    currentBagId
                )));
                
                // 随机金额范围：平均值的10%到200%
                uint256 minAmount = avgAmount / 10;
                if(minAmount == 0) minAmount = 1;
                
                reward = minAmount + (randomSeed % (maxAmount - minAmount + 1));
            }
        }
        
        // 记录领取信息
        claimedInfo[currentBagId][msg.sender] = reward;
        bagHistory[currentBagId].remainingCount--;
        bagHistory[currentBagId].remainingAmount -= reward;
        
        // 如果是最后一个红包，标记轮次结束
        if (bagHistory[currentBagId].remainingCount == 0) {
            bagHistory[currentBagId].isActive = false;
        }
        
        payable(msg.sender).transfer(reward);
        
        emit BagClaimed(currentBagId, msg.sender, reward);
    }
    
    // 查询历史轮次信息
    function getBagInfo(uint256 bagId) public view returns (BagInfo memory) {
        return bagHistory[bagId];
    }
    
    // 查询用户在某轮次的领取金额
    function getUserClaimedAmount(uint256 bagId, address user) public view returns (uint256) {
        return claimedInfo[bagId][user];
    }
    
    // 获取当前活跃的bag ID
    function getCurrentBagId() public view returns (uint256) {
        return currentBagId;
    }
    
    // 事件
    event BagCreated(uint256 indexed bagId, address indexed creator, uint256 totalAmount, uint256 count, bool isEqual);
    event BagClaimed(uint256 indexed bagId, address indexed claimer, uint256 amount);
}