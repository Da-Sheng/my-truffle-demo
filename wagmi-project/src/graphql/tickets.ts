import { gql } from '@apollo/client'

// 票务类型定义
export interface Ticket {
  id: string
  uni256: string
  title: string
  price: number
  totalQuantity: number
  availableQuantity: number
  soldQuantity: number
  venue: string
  startTime: string
  organizer: string
  isReleased: boolean
  isEnabled: boolean
  isExpired: boolean
  isSoldOut: boolean
}

export interface TicketInput {
  title: string
  price: number
  totalQuantity: number
  startTime: string
  venue: string
  organizer: string
  isReleased: boolean
}

export interface TicketStats {
  totalTickets: number
  releasedTickets: number
  totalSold: number
  totalAvailable: number
}

// 查询所有票务
export const GET_ALL_TICKETS = gql`
  query GetAllTickets {
    tickets {
      id
      uni256
      title
      price
      availableQuantity
      venue
      isReleased
      startTime
      organizer
      isSoldOut
    }
  }
`

// 获取可购买票务
export const GET_AVAILABLE_TICKETS = gql`
  query GetAvailableTickets {
    availableTickets {
      id
      uni256
      title
      price
      availableQuantity
      venue
      startTime
      organizer
    }
  }
`

// 根据uni256获取票务详情
export const GET_TICKET_BY_UNI256 = gql`
  query GetTicketByUni256($uni256: String!) {
    ticket(uni256: $uni256) {
      id
      uni256
      title
      price
      totalQuantity
      availableQuantity
      soldQuantity
      venue
      startTime
      organizer
      isReleased
      isEnabled
      isExpired
      isSoldOut
    }
  }
`

// 票务统计
export const GET_TICKET_STATS = gql`
  query GetTicketStats {
    ticketStats {
      totalTickets
      releasedTickets
      totalSold
      totalAvailable
    }
  }
`

// 搜索票务
export const SEARCH_TICKETS = gql`
  query SearchTickets($filter: TicketFilterInput) {
    ticketsByFilter(filter: $filter) {
      id
      uni256
      title
      venue
      price
      availableQuantity
      startTime
      organizer
    }
  }
`

// 创建票务
export const CREATE_TICKET = gql`
  mutation CreateTicket($input: TicketInput!) {
    createTicket(input: $input) {
      id
      uni256
      title
      price
      totalQuantity
      venue
      startTime
      organizer
    }
  }
`

// 购买票务 (注意：每个票数量固定为1)
export const PURCHASE_TICKET = gql`
  mutation PurchaseTicket($uni256: String!, $quantity: Int) {
    purchaseTicket(uni256: $uni256, quantity: $quantity) {
      title
      availableQuantity
      soldQuantity
      isSoldOut
    }
  }
` 