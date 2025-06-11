import { RemarkMsg as RemarkMsgEvent } from "../generated/DataToChain/DataToChain"
import { RemarkMsg } from "../generated/schema"

export function handleRemarkMsg(event: RemarkMsgEvent): void {
  let entity = new RemarkMsg(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.sender = event.params.sender
  entity.timestamp = event.params.timestamp
  entity.data = event.params.data

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
