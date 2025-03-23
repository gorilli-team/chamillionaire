import { ethers } from "ethers";
import VaultFactoryAbi from "../abi/VaultFactory.json";
import VaultAbi from "../abi/Vault.json";
import ERC20Abi from "../abi/ERC20.json";
import { getQuote } from "./0x";

export async function executeSwap(
  fromTokenSymbol: string,
  toTokenSymbol: string,
  amount: number,
  userAddress: string
) {
  try {
    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    // Get the VaultFactory contract
    const factoryContract = new ethers.Contract(
      process.env.FACTORY_ADDRESS!,
      VaultFactoryAbi,
      wallet
    );

    console.log("Factory contract address:", process.env.FACTORY_ADDRESS);
    console.log("User address:", userAddress);

    // Fetch the user’s vault
    console.log("Checking vault for user...");
    const userVault = await factoryContract.vaults(userAddress);
    console.log("Retrieved vault address:", userVault);

    if (userVault === ethers.ZeroAddress) {
      console.log("No vault found for user");
      throw new Error("Vault not found");
    }
    console.log("Successfully found vault for user");

    // Get the token addresses from the 0x API or another source
    const { transaction, fromTokenAddress } = await getQuote(
      fromTokenSymbol,
      toTokenSymbol,
      amount,
      userVault
    );

    // Ensure the Vault has enough balance of the token to swap
    const fromTokenContract = new ethers.Contract(
      fromTokenAddress,
      ERC20Abi,
      provider
    );
    const vaultBalance = await fromTokenContract.balanceOf(userVault);
    console.log("Vault balance:", vaultBalance.toString());

    if (vaultBalance.lt(amount)) {
      throw new Error("Vault does not have enough balance for the swap.");
    }

    // Ensure the Vault has approved the 0x contract to spend its tokens
    const zeroExExchangeProxy = transaction.to; // 0x contract address
    const allowance = await fromTokenContract.allowance(
      userVault,
      zeroExExchangeProxy
    );
    console.log("Allowance for 0x contract:", allowance.toString());

    if (allowance.lt(amount)) {
      throw new Error("Vault has not approved 0x for token transfer.");
    }

    // Execute the swap via the Vault contract
    console.log("Executing swap...");
    const vaultContract = new ethers.Contract(userVault, VaultAbi, wallet);
    const tx = await vaultContract.execute(
      transaction.to,
      transaction.value,
      transaction.data
    );

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.transactionHash);

    return receipt;
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  }
}
