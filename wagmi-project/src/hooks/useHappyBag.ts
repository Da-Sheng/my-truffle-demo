// HappyBag智能合约交互hooks
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import BigNumber from 'bignumber.js'
import { happyBagConfig, BagInfo, BagStatus } from '../contracts/happyBag'

// 获取当前红包ID
export function useCurrentBagId() {
  return useReadContract({
    ...happyBagConfig,
    functionName: 'getCurrentBagId',
    query: {
      refetchInterval: 10000, // 每10秒刷新一次
      staleTime: 5000, // 5秒内认为数据是新鲜的
    }
  })
}

// 获取红包信息
export function useBagInfo(bagId: BigNumber | undefined) {
  return useReadContract({
    ...happyBagConfig,
    functionName: 'getBagInfo',
    args: bagId ? [BigInt(bagId.toFixed(0))] : undefined,
    query: {
      enabled: !!(bagId && bagId.isGreaterThan(0)),
      refetchInterval: 15000, // 每15秒刷新一次
      staleTime: 10000, // 10秒内认为数据是新鲜的
    },
  })
}

// 获取用户在指定红包中的领取金额
export function useUserClaimedAmount(bagId: BigNumber | undefined, userAddress: string | undefined) {
  return useReadContract({
    ...happyBagConfig,
    functionName: 'getUserClaimedAmount',
    args: bagId && userAddress ? [BigInt(bagId.toFixed(0)), userAddress] : undefined,
    query: {
      enabled: !!(bagId && userAddress && bagId.isGreaterThan(0)),
      refetchInterval: 20000, // 每20秒刷新一次
      staleTime: 15000, // 15秒内认为数据是新鲜的
    },
  })
}

// 创建红包
export function useCreateBag() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash })

  const createBag = (amount: string, count: number, isEqual: boolean) => {
    writeContract({
      ...happyBagConfig,
      functionName: 'initBag',
      args: [BigInt(count), isEqual],
      value: parseEther(amount),
    })
  }

  return {
    createBag,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// 领取红包
export function useClaimBag() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash })

  const claimBag = () => {
    writeContract({
      ...happyBagConfig,
      functionName: 'claim',
    })
  }

  return {
    claimBag,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// 计算红包状态
export function useBagStatus(bagInfo: BagInfo | undefined, userAddress: string | undefined, bagId: BigNumber | undefined): BagStatus {
  const { data: userClaimedAmount } = useUserClaimedAmount(bagId, userAddress)

  if (!bagInfo) {
    return BagStatus.PENDING_DEPOSIT
  }

  // 如果用户已经领取过，显示已完成
  if (userClaimedAmount !== undefined && typeof userClaimedAmount === 'bigint' && userClaimedAmount > 0n) {
    return BagStatus.COMPLETED
  }

  // 如果红包已经不活跃或没有剩余数量，显示已完成
  if (!bagInfo.isActive || bagInfo.remainingCount.isEqualTo(0)) {
    return BagStatus.COMPLETED
  }

  // 如果有剩余数量且红包活跃，显示可领取
  return BagStatus.AVAILABLE
}

// 格式化金额显示
export function formatAmount(amount: BigNumber | bigint | undefined): string {
  if (!amount) return '0'
  
  // 如果是BigNumber类型
  if (amount instanceof BigNumber) {
    // 将wei转换为ether (除以10^18)
    return amount.dividedBy(new BigNumber('1e18')).toFixed(4)
  }
  
  // 如果是bigint类型，使用formatEther
  return formatEther(amount as bigint)
} 