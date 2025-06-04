import { useState } from 'react'
import { useQuery, useMutation, useApolloClient } from '@apollo/client'
import { 
  GET_ALL_TICKETS, 
  GET_AVAILABLE_TICKETS, 
  GET_TICKET_BY_UNI256,
  GET_TICKET_STATS,
  SEARCH_TICKETS,
  CREATE_TICKET,
  PURCHASE_TICKET,
  type Ticket,
  type TicketInput,
  type TicketStats
} from '../graphql/tickets'

// 获取所有票务
export const useGetAllTickets = () => {
  return useQuery<{ tickets: Ticket[] }>(GET_ALL_TICKETS, {
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  })
}

// 获取可购买票务
export const useGetAvailableTickets = () => {
  return useQuery<{ availableTickets: Ticket[] }>(GET_AVAILABLE_TICKETS, {
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  })
}

// 根据uni256获取票务详情
export const useGetTicketByUni256 = (uni256: string) => {
  return useQuery<{ ticket: Ticket }>(GET_TICKET_BY_UNI256, {
    variables: { uni256 },
    skip: !uni256,
    errorPolicy: 'all',
  })
}

// 获取票务统计
export const useGetTicketStats = () => {
  return useQuery<{ ticketStats: TicketStats }>(GET_TICKET_STATS, {
    errorPolicy: 'all',
  })
}

// 搜索票务
export const useSearchTickets = () => {
  const [searchResult, setSearchResult] = useState<Ticket[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const client = useApolloClient()

  const searchTickets = async (filter: any) => {
    setIsSearching(true)
    try {
      const { data } = await client.query({
        query: SEARCH_TICKETS,
        variables: { filter },
        fetchPolicy: 'network-only',
      })
      setSearchResult(data?.ticketsByFilter || [])
    } catch (error) {
      console.error('搜索票务失败:', error)
      setSearchResult([])
    } finally {
      setIsSearching(false)
    }
  }

  return {
    searchResult,
    isSearching,
    searchTickets,
  }
}

// 创建票务
export const useCreateTicket = () => {
  const [createTicket, { loading, error }] = useMutation(CREATE_TICKET, {
    refetchQueries: [
      { query: GET_ALL_TICKETS },
      { query: GET_AVAILABLE_TICKETS },
      { query: GET_TICKET_STATS },
    ],
  })

  const handleCreateTicket = async (input: TicketInput) => {
    try {
      const { data } = await createTicket({
        variables: { input },
      })
      
      if (data?.createTicket) {
        console.log('票务创建成功:', data.createTicket)
        return {
          success: true,
          ticket: data.createTicket,
          message: '票务创建成功',
        }
      } else {
        return {
          success: false,
          message: '票务创建失败',
        }
      }
    } catch (err: any) {
      console.error('创建票务失败:', err)
      return {
        success: false,
        message: err.message || '票务创建失败',
      }
    }
  }

  return {
    createTicket: handleCreateTicket,
    loading,
    error,
  }
}

// 购买票务
export const usePurchaseTicket = () => {
  const [purchaseTicket, { loading, error }] = useMutation(PURCHASE_TICKET, {
    refetchQueries: [
      { query: GET_ALL_TICKETS },
      { query: GET_AVAILABLE_TICKETS },
      { query: GET_TICKET_STATS },
    ],
  })

  const handlePurchaseTicket = async (uni256: string, quantity: number = 1) => {
    try {
      const { data } = await purchaseTicket({
        variables: { uni256, quantity },
      })
      
      if (data?.purchaseTicket) {
        console.log('票务购买成功:', data.purchaseTicket)
        return {
          success: true,
          ticket: data.purchaseTicket,
          message: `成功购买 ${quantity} 张票务`,
        }
      } else {
        return {
          success: false,
          message: '票务购买失败',
        }
      }
    } catch (err: any) {
      console.error('购买票务失败:', err)
      return {
        success: false,
        message: err.message || '票务购买失败',
      }
    }
  }

  return {
    purchaseTicket: handlePurchaseTicket,
    loading,
    error,
  }
}

// 票务详情hook，包含刷新功能
export const useTicketDetail = (uni256: string) => {
  const { data, loading, error, refetch } = useGetTicketByUni256(uni256)
  
  const refreshTicket = () => {
    refetch()
  }

  return {
    ticket: data?.ticket,
    loading,
    error,
    refreshTicket,
  }
} 