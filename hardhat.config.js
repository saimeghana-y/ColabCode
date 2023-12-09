require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
const fs = require('fs');
// const infuraId = fs.readFileSync(".infuraid").toString().trim() || "";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/RL_Nk0UhXVFxXeVZM8LYgl3PGlZFntzE',
      accounts: [ '8f62d14bea73905e313f3ca07fd110403a5a52fd0568b22791ca58ffce6175ab' ]
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};