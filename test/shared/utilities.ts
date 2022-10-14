import { Web3Provider } from '@ethersproject/providers';
import { BigNumber, Contract } from 'ethers';
import {
  defaultAbiCoder,
  getAddress,
  keccak256,
  solidityPack,
  toUtf8Bytes
} from 'ethers/lib/utils';

const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes(
    'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
  )
);

/**
 * @export
 * @param {number} n
 * @return {*}  {BigNumber}
 */
export function expandTo18Decimals(n: number): BigNumber {
  // mul => multiply
  return BigNumber.from(n).mul(BigNumber.from(10).pow(18));
}

function getDomainSeparator(name: string, tokenAddress: string) {
  return keccak256(
    defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        keccak256(
          toUtf8Bytes(
            'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
          )
        ),
        keccak256(toUtf8Bytes(name)),
        // version
        keccak256(toUtf8Bytes('1')),
        // chainId
        1,
        // contract
        tokenAddress,
      ]
    )
  );
}

export async function getApprovalDigest(
  token: Contract,
  approve: {
    owner: string;
    spender: string;
    value: BigNumber;
  },
  nonce: BigNumber,
  deadline: BigNumber
): Promise<string> {
  const name = await token.name();
  const DOMAIN_SEPARATOR = getDomainSeparator(name, token.address);
  return keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [
              PERMIT_TYPEHASH,
              approve.owner,
              approve.spender,
              approve.value,
              nonce,
              deadline,
            ]
          )
        ),
      ]
    )
  );
}

export async function mineBlock(
  privider: Web3Provider,
  timestamp: number
): Promise<void> {
  await new Promise(async (resolve, reject) => {
    privider.provider.sendAsync?.(
      {
        // jsonrpc: '2.0',
        method: 'evm_mine',
        params: [timestamp],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
}

export function encodePrice(reserve0: BigNumber, reserve1: BigNumber) {
  return [
    reserve1.mul(BigNumber.from(2).pow(112)).div(reserve0),
    reserve0.mul(BigNumber.from(2).pow(112)).div(reserve1),
  ];
}

export function getCreate2Address(
  factoryAddress: string,
  [tokenA, tokenB]: string[],
  bytecode: string
): string {
  const [token0, token1] =
    tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
  const create2Inputs = [
    '0xff',
    factoryAddress,
    keccak256(solidityPack(['address', 'address'], [token0, token1])),
    keccak256(bytecode),
  ];
  const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join('')}`;
  return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`);
}
