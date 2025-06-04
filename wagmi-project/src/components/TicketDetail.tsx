import React from 'react'
import { useTicketDetail, usePurchaseTicket } from '../hooks/useTickets'

interface TicketDetailProps {
  uni256: string
  onClose: () => void
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ uni256, onClose }) => {
  const { ticket, loading, error, refreshTicket } = useTicketDetail(uni256)
  const { purchaseTicket, loading: isPurchasing } = usePurchaseTicket()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2) // 假设价格以分为单位
  }

  const handlePurchase = async () => {
    if (!ticket) return
    
    try {
      const result = await purchaseTicket(uni256, 1)
      
      if (result.success) {
        alert(`购买成功！${result.message}`)
        refreshTicket() // 刷新票务详情
      } else {
        alert(`购买失败：${result.message}`)
      }
    } catch (error) {
      console.error('购买票务出错:', error)
      alert('购买过程中出现错误，请稍后重试')
    }
  }

  const getStatusBadge = () => {
    if (!ticket) return null
    
    if (ticket.isSoldOut) {
      return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">已售罄</span>
    }
    if (ticket.isExpired) {
      return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">已过期</span>
    }
    if (!ticket.isReleased) {
      return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">未发布</span>
    }
    if (!ticket.isEnabled) {
      return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">已停售</span>
    }
    return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">可购买</span>
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">加载票务详情中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              加载失败
            </h3>
            <p className="text-red-600 mb-4">
              {error?.message || '无法加载票务详情'}
            </p>
            <div className="flex space-x-2 justify-center">
              <button
                onClick={refreshTicket}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                重试
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const canPurchase = ticket.isReleased && 
                     ticket.isEnabled && 
                     !ticket.isExpired && 
                     !ticket.isSoldOut && 
                     ticket.availableQuantity > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex justify-between items-start p-6 border-b">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {ticket.title}
            </h2>
            {getStatusBadge()}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
          >
            ×
          </button>
        </div>

        {/* 主要信息 */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-20 text-gray-500">价格:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ¥{formatPrice(ticket.price)}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-20 text-gray-500">场地:</span>
                  <span className="text-gray-900">{ticket.venue}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-gray-500">主办方:</span>
                  <span className="text-gray-900">{ticket.organizer}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-gray-500">时间:</span>
                  <span className="text-gray-900">{formatDate(ticket.startTime)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">销售信息</h3>
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-20 text-gray-500">总票数:</span>
                  <span className="text-gray-900">{ticket.totalQuantity} 张</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-gray-500">已售:</span>
                  <span className="text-gray-900">{ticket.soldQuantity} 张</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-gray-500">剩余:</span>
                  <span className={ticket.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'}>
                    {ticket.availableQuantity} 张
                  </span>
                </div>
                <div className="flex">
                  <span className="w-20 text-gray-500">编号:</span>
                  <span className="text-gray-500 text-sm font-mono">{ticket.uni256}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 销售进度条 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>销售进度</span>
              <span>{ticket.soldQuantity}/{ticket.totalQuantity}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(ticket.soldQuantity / ticket.totalQuantity) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          {/* 购买按钮 */}
          <div className="flex space-x-4">
            <button
              onClick={refreshTicket}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors"
            >
              刷新信息
            </button>
            <button
              onClick={handlePurchase}
              disabled={!canPurchase || isPurchasing}
              className={`flex-1 px-6 py-3 rounded-md transition-colors ${
                !canPurchase
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isPurchasing
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {!canPurchase 
                ? '无法购买' 
                : isPurchasing 
                ? '购买中...' 
                : '立即购买 (1张)'
              }
            </button>
          </div>

          {/* 提示信息 */}
          {!canPurchase && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                {ticket.isSoldOut && '该票务已售罄'}
                {ticket.isExpired && '该票务已过期'}
                {!ticket.isReleased && '该票务尚未发布'}
                {!ticket.isEnabled && '该票务已停止销售'}
                {ticket.availableQuantity === 0 && !ticket.isSoldOut && '暂无可购买票数'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 