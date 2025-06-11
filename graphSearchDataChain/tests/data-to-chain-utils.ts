import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { RemarkMsg } from "../generated/DataToChain/DataToChain"

export function createRemarkMsgEvent(
  sender: Address,
  timestamp: BigInt,
  data: Bytes
): RemarkMsg {
  let remarkMsgEvent = changetype<RemarkMsg>(newMockEvent())

  remarkMsgEvent.parameters = new Array()

  remarkMsgEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  remarkMsgEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )
  remarkMsgEvent.parameters.push(
    new ethereum.EventParam("data", ethereum.Value.fromBytes(data))
  )

  return remarkMsgEvent
}
