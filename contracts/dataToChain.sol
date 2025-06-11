// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.22 <0.9.0;

contract DataToChain {
    event RemarkMsg(address indexed sender, uint256 timestamp, bytes data);

    function StoreData (bytes memory _data) public {
        emit RemarkMsg(msg.sender, block.timestamp, _data);
    }
}