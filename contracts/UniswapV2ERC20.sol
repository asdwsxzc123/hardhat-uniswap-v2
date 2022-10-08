// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./interfaces/IUniswapV2ERC20.sol";
import "./libraries/SafeMath.sol";

abstract contract UniswapV2ERC20 is IUniswapV2ERC20 {
    using SafeMath for uint;

    string public constant name = "Uniswap V2";
    string public constant symbol = "UNI-V2";
    uint8 public constant decimals = 18;
    uint public totalSupply;
    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH =
        0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    mapping(address => uint) public nonces;

    // event Appoval and event Transfer. solidity v0.8 cannot defined event with same name and parameter  

    constructor () public {
      uint chainId;
      assembly {
        chainId := chainid
      }
    }

}
