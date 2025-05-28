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

  // 添加调试日志
  console.log('🔍 BagStatus Debug:', {
    bagId: bagId?.toString(),
    userAddress,
    bagInfo,
    userClaimedAmount,
    isActive: bagInfo?.isActive,
    remainingCount: bagInfo?.remainingCount?.toString()
  })

  if (!bagInfo) {
    console.log('❌ No bagInfo, status: PENDING_DEPOSIT')
    return BagStatus.PENDING_DEPOSIT
  }

  // 如果用户已经领取过，显示已完成
  if (userClaimedAmount !== undefined && typeof userClaimedAmount === 'bigint' && userClaimedAmount > 0n) {
    console.log('✅ User already claimed, status: COMPLETED')
    return BagStatus.COMPLETED
  }

  // 检查剩余数量
  if (bagInfo.remainingCount.isLessThanOrEqualTo(0)) {
    console.log('❌ No remaining count, status: COMPLETED')
    return BagStatus.COMPLETED
  }

  // 检查红包是否活跃
  if (!bagInfo.isActive) {
    console.log('❌ Bag not active, status: PENDING_DEPOSIT')
    return BagStatus.PENDING_DEPOSIT
  }

  // 如果有剩余数量且红包活跃，显示可领取
  console.log('🎉 Bag available for claim, status: AVAILABLE')
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

// 格式化红包ID显示
export function formatBagId(bagId: BigNumber | bigint | undefined): string {
  if (!bagId) return '0'
  
  let idStr: string
  if (bagId instanceof BigNumber) {
    idStr = bagId.toString()
  } else {
    idStr = bagId.toString()
  }
  
  // 如果ID长度超过12位，显示前6位...后4位
  if (idStr.length > 12) {
    return `${idStr.slice(0, 6)}...${idStr.slice(-4)}`
  }
  
  return idStr
}

// 获取红包领取记录
export function useBagClaimRecords(bagId: BigNumber | undefined) {
  // 注意：这里应该使用 wagmi 的 useLogs 或类似的 hook 来获取区块链事件
  // 目前先返回空数组，因为需要配置事件监听
  
  // TODO: 实现真实的事件监听
  // 例如：监听 'Claim' 事件
  // const { data: claimEvents } = useLogs({
  //   address: happyBagConfig.address,
  //   event: parseAbiItem('event Claim(uint256 indexed bagId, address indexed user, uint256 amount)'),
  //   args: { bagId: bagId ? BigInt(bagId.toFixed(0)) : undefined },
  //   fromBlock: 'earliest'
  // })
  
  return {
    data: [], // 暂时返回空数组
    isLoading: false,
    error: null
  }
} 