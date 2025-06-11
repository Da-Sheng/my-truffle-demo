import { RemarkMsg } from "../generated/DataToChain/DataToChain"
import { RemarkMessage, User, DailyStats, GlobalStats, MessageByHour } from "../generated/schema"
import { Bytes, BigInt, Address } from "@graphprotocol/graph-ts"

export function handleRemarkMsg(event: RemarkMsg): void {
  let messageId = event.transaction.hash.concatI32(event.logIndex.toI32())
  let message = new RemarkMessage(messageId)
  
  message.sender = event.params.sender
  message.timestamp = event.params.timestamp
  message.data = event.params.data
  message.decodedData = tryDecodeBytes(event.params.data)
  message.blockNumber = event.block.number
  message.blockTimestamp = event.block.timestamp
  message.transactionHash = event.transaction.hash
  message.gasUsed = BigInt.fromI32(0)
  message.gasPrice = BigInt.fromI32(0)
  
  let user = User.load(event.params.sender)
  if (user == null) {
    user = new User(event.params.sender)
    user.totalMessages = BigInt.fromI32(0)
    user.firstMessageAt = event.params.timestamp
    user.totalDataSize = BigInt.fromI32(0)
    user.totalGasCost = BigInt.fromI32(0)
    user.save()
  }
  message.user = user.id
  
  message.save()

  updateUser(event)
  updateDailyStats(event)
  updateGlobalStats(event)
  updateHourlyStats(event)
}

function updateUser(event: RemarkMsg): void {
  let user = User.load(event.params.sender)
  if (user == null) {
    user = new User(event.params.sender)
    user.totalMessages = BigInt.fromI32(0)
    user.firstMessageAt = event.params.timestamp
    user.totalDataSize = BigInt.fromI32(0)
    user.totalGasCost = BigInt.fromI32(0)
  }
  
  user.totalMessages = user.totalMessages.plus(BigInt.fromI32(1))
  user.lastMessageAt = event.params.timestamp
  user.totalDataSize = user.totalDataSize.plus(BigInt.fromI32(event.params.data.length))
  user.totalGasCost = user.totalGasCost.plus(BigInt.fromI32(0))
  
  user.save()
}

function updateDailyStats(event: RemarkMsg): void {
  let dayId = event.block.timestamp.toI32() / 86400
  let dayIdBytes = Bytes.fromI32(dayId)
  let dailyStats = DailyStats.load(dayIdBytes)
  
  if (dailyStats == null) {
    dailyStats = new DailyStats(dayIdBytes)
    dailyStats.date = BigInt.fromI32(dayId * 86400)
    dailyStats.messageCount = BigInt.fromI32(0)
    dailyStats.activeUsers = BigInt.fromI32(0)
    dailyStats.newUsers = BigInt.fromI32(0)
    dailyStats.totalDataSize = BigInt.fromI32(0)
    dailyStats.totalGasUsed = BigInt.fromI32(0)
    dailyStats.averageGasPrice = BigInt.fromI32(0)
    dailyStats.averageMessageSize = BigInt.fromI32(0)
  }
  
  dailyStats.messageCount = dailyStats.messageCount.plus(BigInt.fromI32(1))
  dailyStats.totalDataSize = dailyStats.totalDataSize.plus(BigInt.fromI32(event.params.data.length))
  dailyStats.totalGasUsed = dailyStats.totalGasUsed.plus(BigInt.fromI32(0))
  dailyStats.averageGasPrice = BigInt.fromI32(0)
  
  if (dailyStats.messageCount.gt(BigInt.fromI32(0))) {
    dailyStats.averageMessageSize = dailyStats.totalDataSize.div(dailyStats.messageCount)
  }
  
  let user = User.load(event.params.sender)
  if (user && user.totalMessages.equals(BigInt.fromI32(1))) {
    dailyStats.newUsers = dailyStats.newUsers.plus(BigInt.fromI32(1))
  }
  
  dailyStats.save()
}

function updateGlobalStats(event: RemarkMsg): void {
  let globalStats = GlobalStats.load(Bytes.fromHexString("0x01"))
  if (globalStats == null) {
    globalStats = new GlobalStats(Bytes.fromHexString("0x01"))
    globalStats.totalMessages = BigInt.fromI32(0)
    globalStats.totalUsers = BigInt.fromI32(0)
    globalStats.totalDataSize = BigInt.fromI32(0)
    globalStats.totalGasUsed = BigInt.fromI32(0)
    globalStats.averageMessageSize = BigInt.fromI32(0)
  }
  
  globalStats.totalMessages = globalStats.totalMessages.plus(BigInt.fromI32(1))
  globalStats.totalDataSize = globalStats.totalDataSize.plus(BigInt.fromI32(event.params.data.length))
  globalStats.totalGasUsed = globalStats.totalGasUsed.plus(BigInt.fromI32(0))
  globalStats.lastUpdated = event.block.timestamp
  globalStats.lastBlockNumber = event.block.number
  
  if (globalStats.totalMessages.gt(BigInt.fromI32(0))) {
    globalStats.averageMessageSize = globalStats.totalDataSize.div(globalStats.totalMessages)
  }
  
  let user = User.load(event.params.sender)
  if (user && user.totalMessages.equals(BigInt.fromI32(1))) {
    globalStats.totalUsers = globalStats.totalUsers.plus(BigInt.fromI32(1))
  }
  
  globalStats.save()
}

function updateHourlyStats(event: RemarkMsg): void {
  let hourId = event.block.timestamp.toI32() / 3600
  let hourIdBytes = Bytes.fromI32(hourId)
  let hourlyStats = MessageByHour.load(hourIdBytes)
  
  if (hourlyStats == null) {
    hourlyStats = new MessageByHour(hourIdBytes)
    hourlyStats.hour = BigInt.fromI32(hourId * 3600)
    hourlyStats.messageCount = BigInt.fromI32(0)
    hourlyStats.activeUsers = BigInt.fromI32(0)
    hourlyStats.totalDataSize = BigInt.fromI32(0)
  }
  
  hourlyStats.messageCount = hourlyStats.messageCount.plus(BigInt.fromI32(1))
  hourlyStats.totalDataSize = hourlyStats.totalDataSize.plus(BigInt.fromI32(event.params.data.length))
  
  hourlyStats.save()
}

function tryDecodeBytes(data: Bytes): string {
  let str = data.toString()
  if (str.length > 0) {
    return str
  }
  return data.toHexString()
} 