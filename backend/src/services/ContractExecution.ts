import { ethers } from "ethers";
import VaultFactoryAbi from "../abi/VaultFactory.json";
import VaultAbi from "../abi/Vault.json";
import { getQuote } from "./0x";

export async function executeSwap(
  fromTokenSymbol: string,
  toTokenSymbol: string,
  amount: number,
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

  const { transaction } = await getQuote(
    fromTokenSymbol,
    toTokenSymbol,
    amount,
    userVault
  );

  const vaultContract = new ethers.Contract(userVault, VaultAbi, wallet);
  const tx = await vaultContract.execute(
    transaction.to,
    transaction.value,
    transaction.data
  );
  const receipt = await tx.wait();
  return receipt;
}
