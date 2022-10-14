import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { UniswapV2Factory } from '../typechain-types';
const MINIMUM_LIQUIDITY = BigNumber.from(10).pow(3);

describe('UniswapV2Pair', () => {
  let wallet: SignerWithAddress,
    other: SignerWithAddress,
    factory: UniswapV2Factory;
  async function deploy() {
    const [wallet, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('UniswapV2Factory');
    return {
      wallet,
      other,
      factory,
    };
  }
  beforeEach(async () => {
    const contract = await loadFixture(deploy);
    wallet = contract.wallet;
    other = contract.other;
  });
});
