// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.22 <0.9.0;

contract Ioc {
    string public constant name = "IOC";
    address payable private owner;
    address payable private _from;
    uint256 public balance;
    event CollectEth (string name, uint256 amount);

    constructor() {
        owner = payable (msg.sender);
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getBalance () public view returns (uint256) {
        return address(this).balance;
    }

    function collectEth () public payable {
        require(msg.sender != owner, "not allow tranfer self");
        balance += msg.value;
        emit CollectEth (name, msg.value);
    }

    function withdraw (uint256 amount, address _to) public {
        require(msg.sender == owner, "not owner");
        require(amount <= address(this).balance, "Not enough ETH to withdraw!");
        payable (_to).transfer(amount);
        balance -= amount;
    }
}