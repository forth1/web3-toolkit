// solidity/MyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    // 构造函数只要一个参数：初始总量
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        // 这里按 18 位精度来铸造
        _mint(msg.sender, initialSupply);
    }
}
