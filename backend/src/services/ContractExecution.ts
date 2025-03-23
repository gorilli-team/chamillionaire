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

    // Fetch the user's vault
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

    if (!fromTokenAddress) {
      throw new Error("Failed to get fromTokenAddress from quote");
    }

    // Ensure the Vault has enough balance of the token to swap
    const fromTokenContract = new ethers.Contract(
      fromTokenAddress,
      ERC20Abi,
      provider
    );
    const vaultBalance = await fromTokenContract.balanceOf(userVault);
    console.log("Vault balance:", vaultBalance.toString());

    if (vaultBalance < amount) {
      throw new Error("Vault does not have enough balance for the swap.");
    }

    // Ensure the Vault has approved the 0x contract to spend its tokens
    const zeroExExchangeProxy = transaction.to; // 0x contract address
    let allowance = await fromTokenContract.allowance(
      userVault,
      zeroExExchangeProxy
    );
    console.log("Initial allowance for 0x contract:", allowance.toString());

    // If allowance is 0 or less than the amount we want to swap
    if (allowance === 0 || allowance < amount) {
      console.log("Approving 0x contract for token transfer...");
      const vaultContract = new ethers.Contract(userVault, VaultAbi, wallet);
      const approveTx = await vaultContract.execute(
        fromTokenAddress,
        0,
        fromTokenContract.interface.encodeFunctionData("approve", [
          zeroExExchangeProxy,
          ethers.MaxUint256, // Approve maximum amount
        ])
      );
      console.log("Approval transaction sent:", approveTx.hash);
      const approveReceipt = await approveTx.wait();
      console.log(
        "Approval transaction confirmed:",
        approveReceipt.transactionHash
      );

      // Wait a bit for the blockchain to update
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check allowance again
      allowance = await fromTokenContract.allowance(
        userVault,
        zeroExExchangeProxy
      );
      console.log("New allowance for 0x contract:", allowance.toString());

      if (allowance === 0) {
        throw new Error("Approval transaction failed to update allowance");
      }
    } else {
      console.log(
        "Vault already has sufficient allowance:",
        allowance.toString()
      );
    }

    // Execute the swap via the Vault contract
    console.log("Executing swap...");
    console.log("Transaction parameters:", {
      to: transaction.to,
      value: transaction.value.toString(),
      data: transaction.data,
      fromTokenAddress,
      userVault,
      amount: amount.toString(),
    });

    const vaultContract = new ethers.Contract(userVault, VaultAbi, wallet);

    try {
      // Try to estimate gas first
      const gasEstimate = await vaultContract.execute.estimateGas(
        transaction.to,
        transaction.value,
        transaction.data
      );
      console.log("Estimated gas:", gasEstimate.toString());
    } catch (gasError) {
      console.error("Gas estimation failed:", gasError);
      // Log the full error details
      if (gasError instanceof Error) {
        console.error("Error details:", {
          message: gasError.message,
          stack: gasError.stack,
          data: (gasError as any).data,
        });
      }
      throw gasError;
    }

    console.log("Sending transaction...");
    const tx = await vaultContract.execute(
      transaction.to,
      transaction.value,
      transaction.data,
      { gasLimit: 500000 } // Set a reasonable gas limit
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
