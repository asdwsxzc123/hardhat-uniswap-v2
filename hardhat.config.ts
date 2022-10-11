import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { HardhatUserConfig } from 'hardhat/config';
dotenv.config();
const config: HardhatUserConfig = {
  solidity: '0.8.9',
  networks: {
    hardhat: {
      // 设置链id
      chainId: 1,
    },
  },
};

export default config;
