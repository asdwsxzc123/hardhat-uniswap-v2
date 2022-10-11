import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ecsign } from 'ethereumjs-util';
import { BigNumber } from 'ethers';
import {
  defaultAbiCoder,
  hexlify,
  keccak256,
  toUtf8Bytes
} from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { ERC20 } from '../typechain-types';
import { expandTo18Decimals, getApprovalDigest } from './shared/utilities';
const { constants, utils } = ethers;
const TOTAL_SUPPLY = expandTo18Decimals(1e4);
const TEST_AMOUNT = expandTo18Decimals(10);

describe('UniswapV2ERC20', () => {
  let wallet: SignerWithAddress, other: SignerWithAddress;
  let token: ERC20;
  beforeEach(async () => {
    const [a, b] = await ethers.getSigners();
    wallet = a;
    other = b;
    const contract = await ethers.getContractFactory('ERC20');
    token = await contract.deploy(TOTAL_SUPPLY);
  });
  it('name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async () => {
    const name = await token.name();
    expect(name).eq('Uniswap V2');
    expect(await token.symbol()).eq('UNI-V2');
    expect(await token.decimals()).eq(18);
    expect(await token.totalSupply()).eq(TOTAL_SUPPLY);
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY);
    expect(await token.DOMAIN_SEPARATOR()).to.eq(
      keccak256(
        defaultAbiCoder.encode(
          ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
          [
            keccak256(
              toUtf8Bytes(
                'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
              )
            ),
            keccak256(toUtf8Bytes(name)),
            keccak256(toUtf8Bytes('1')),
            // 可能链id不一样
            1,
            token.address,
          ]
        )
      )
    );
    expect(await token.PERMIT_TYPEHASH()).to.eq(
      keccak256(
        toUtf8Bytes(
          'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
        )
      )
    );
  });
  it('approve', async () => {
    await expect(token.approve(other.address, TEST_AMOUNT))
      .emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).equal(
      TEST_AMOUNT
    );
  });
  it('transfer', async () => {
    await expect(token.transfer(other.address, TEST_AMOUNT))
      .emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.balanceOf(wallet.address)).eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).eq(TEST_AMOUNT);
  });
  it('transfer:fail', async () => {
    await expect(token.transfer(other.address, TOTAL_SUPPLY.add(1))).reverted;
    await expect(token.connect(other).transfer(wallet.address, 1)).reverted;
  });
  it('transferFrom', async () => {
    await token.approve(other.address, TEST_AMOUNT);
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT)
    )
      .emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).eq(0);
    expect(await token.balanceOf(wallet.address)).eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).eq(TEST_AMOUNT);
  });
  it('transfer:max', async () => {
    await token.approve(other.address, constants.MaxUint256);
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT)
    )
      .emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).eq(
      constants.MaxUint256.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(wallet.address)).eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).eq(TEST_AMOUNT);
  });

  it('permit', async () => {
    const nonce = await token.nonces(wallet.address);
    const deadline = constants.MaxUint256;
    // 摘要
    const digest = await getApprovalDigest(
      token,
      {
        owner: wallet.address,
        spender: other.address,
        value: TEST_AMOUNT,
      },
      nonce,
      deadline
    );

    const { v, r, s } = ecsign(
      Buffer.from(digest.slice(2), 'hex'),
      // PRIVATE_KEY from .env file
      Buffer.from(process.env.PRIVATE_KEY.slice(2), 'hex')
    );

    await expect(
      token.permit(
        wallet.address,
        other.address,
        TEST_AMOUNT,
        deadline,
        v,
        hexlify(r),
        hexlify(s)
      )
    )
      .emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).eq(
      TEST_AMOUNT
    );
    expect(await token.nonces(wallet.address)).eq(BigNumber.from(1));
  });
});
