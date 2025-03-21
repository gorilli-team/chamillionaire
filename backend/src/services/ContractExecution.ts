import { ethers } from "ethers";
import VaultFactoryAbi from "../abi/VaultFactory.json";
import VaultAbi from "../abi/Vault.json";

export async function executeTransaction(
  transaction: ethers.TransactionRequest,
  userAddress: string
) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const factoryContract = new ethers.Contract(
    process.env.FACTORY_ADDRESS!,
    VaultFactoryAbi,
    wallet
  );
  const userVault = await factoryContract.vaults(userAddress);
  if (userVault === ethers.ZeroAddress) {
    throw new Error("Vault not found");
  }

  const vaultContract = new ethers.Contract(userVault, VaultAbi, wallet);
  const tx = await vaultContract.execute(
    transaction.to,
    transaction.value,
    transaction.data
  );
  const receipt = await tx.wait();
  return receipt;
}
