import React, { useState } from 'react'
import { useGetAvailableTickets, usePurchaseTicket } from '../hooks/useTickets'
import { TicketDetail } from './TicketDetail'
import type { Ticket } from '../graphql/tickets'

interface TicketCardProps {
  ticket: Ticket
  onPurchase: (uni256: string) => void
  onViewDetail: (ticket: Ticket) => void
  isPurchasing: boolean
}

const TicketCard: React.FC<TicketCardProps> = ({ 
  ticket, 
  onPurchase, 
  onViewDetail, 
  isPurchasing 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2) // 假设价格以分为单位
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900 truncate">
          {ticket.title}
        </h3>
        <span className="text-2xl font-bold text-blue-600">
          ¥{formatPrice(ticket.price)}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <span className="w-16 text-gray-500">场地:</span>
          <span>{ticket.venue}</span>
        </div>
        <div className="flex items-center">
          <span className="w-16 text-gray-500">时间:</span>
          <span>{formatDate(ticket.startTime)}</span>
        </div>
        <div className="flex items-center">
          <span className="w-16 text-gray-500">主办方:</span>
          <span>{ticket.organizer}</span>
        </div>
        <div className="flex items-center">
          <span className="w-16 text-gray-500">剩余:</span>
          <span className={ticket.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'}>
            {ticket.availableQuantity} 张
          </span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onViewDetail(ticket)}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
        >
          查看详情
        </button>
        <button
          onClick={() => onPurchase(ticket.uni256)}
          disabled={ticket.availableQuantity === 0 || isPurchasing}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${
            ticket.availableQuantity === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isPurchasing
              ? 'bg-blue-300 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {ticket.availableQuantity === 0 
            ? '已售罄' 
            : isPurchasing 
            ? '购买中...' 
            : '立即购买'
          }
        </button>
      </div>
    </div>
  )
}

export const TicketList: React.FC = () => {
  const { data, loading, error, refetch } = useGetAvailableTickets()
  const { purchaseTicket, loading: isPurchasing } = usePurchaseTicket()
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [purchasingTicket, setPurchasingTicket] = useState<string | null>(null)

  const handlePurchase = async (uni256: string) => {
    setPurchasingTicket(uni256)
    try {
      const result = await purchaseTicket(uni256, 1) // 每次购买1张
      
      if (result.success) {
        alert(`购买成功！${result.message}`)
        refetch() // 刷新票务列表
      } else {
        alert(`购买失败：${result.message}`)
      }
    } catch (error) {
      console.error('购买票务出错:', error)
      alert('购买过程中出现错误，请稍后重试')
    } finally {
      setPurchasingTicket(null)
    }
  }

  const handleViewDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket)
  }

  const handleCloseDetail = () => {
    setSelectedTicket(null)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">加载票务列表中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            加载失败
          </h3>
          <p className="text-red-600 mb-4">
            {error.message || '无法加载票务列表'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  const tickets = data?.availableTickets || []

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          可购买票务 ({tickets.length})
        </h2>
        <button
          onClick={() => refetch()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          刷新列表
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            暂无可购买票务
          </h3>
          <p className="text-gray-500">
            当前没有可购买的票务，请稍后再来查看
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onPurchase={handlePurchase}
              onViewDetail={handleViewDetail}
              isPurchasing={purchasingTicket === ticket.uni256}
            />
          ))}
        </div>
      )}

      {/* 票务详情弹窗 */}
      {selectedTicket && (
        <TicketDetail
          uni256={selectedTicket.uni256}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
} 