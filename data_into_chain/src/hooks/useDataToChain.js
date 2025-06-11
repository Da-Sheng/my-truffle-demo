import { useReadContract } from "wagmi";
import { DataToChainConfig } from "../contracts/dataToChain";

export function useStoreData(data) {
    return useReadContract({
        ...DataToChainConfig,
        functionName: 'StoreData',
        args: data,
    })
}