import React, { useState } from 'react'
import { useCreateTicket } from '../hooks/useTickets'
import type { TicketInput } from '../graphql/tickets'

export const TicketCreate: React.FC = () => {
  const { createTicket, loading, error } = useCreateTicket()
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [formData, setFormData] = useState<TicketInput>({
    title: '',
    price: 0,
    totalQuantity: 1,
    startTime: '',
    venue: '',
    organizer: '',
    isReleased: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.venue || !formData.organizer || !formData.startTime) {
      alert('请填写所有必填字段')
      return
    }

    if (formData.price <= 0) {
      alert('票价必须大于0')
      return
    }

    if (formData.totalQuantity <= 0) {
      alert('票务数量必须大于0')
      return
    }

    // 将价格从元转换为分
    const ticketData = {
      ...formData,
      price: Math.round(formData.price * 100),
    }

    const result = await createTicket(ticketData)
    
    if (result.success) {
      alert(`票务创建成功！${result.message}`)
      // 重置表单
      setFormData({
        title: '',
        price: 0,
        totalQuantity: 1,
        startTime: '',
        venue: '',
        organizer: '',
        isReleased: false,
      })
      setIsFormVisible(false)
    } else {
      alert(`创建失败：${result.message}`)
    }
  }

  const handleCancel = () => {
    setIsFormVisible(false)
    setFormData({
      title: '',
      price: 0,
      totalQuantity: 1,
      startTime: '',
      venue: '',
      organizer: '',
      isReleased: false,
    })
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  if (!isFormVisible) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              票务管理
            </h2>
            <p className="text-gray-600 mb-6">
              创建新的票务，设置价格、数量和销售时间
            </p>
            <button
              onClick={() => setIsFormVisible(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              + 创建新票务
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            创建新票务
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                活动标题 *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="请输入活动标题"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                票价 (元) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                活动场地 *
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                placeholder="请输入活动场地"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="organizer" className="block text-sm font-medium text-gray-700 mb-2">
                主办方 *
              </label>
              <input
                type="text"
                id="organizer"
                name="organizer"
                value={formData.organizer}
                onChange={handleInputChange}
                placeholder="请输入主办方名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="totalQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                票务数量 *
              </label>
              <input
                type="number"
                id="totalQuantity"
                name="totalQuantity"
                value={formData.totalQuantity}
                onChange={handleInputChange}
                placeholder="1"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                每个票都是独立的，建议设置为相应的座位数
              </p>
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                活动时间 *
              </label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                min={getMinDateTime()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* 发布设置 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">发布设置</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isReleased"
                name="isReleased"
                checked={formData.isReleased}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isReleased" className="ml-2 block text-sm text-gray-700">
                立即发布票务（取消勾选将创建为草稿状态）
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              草稿状态的票务不会在前台显示，需要后续手动发布
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-md transition-colors ${
                loading
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? '创建中...' : '创建票务'}
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">
                创建失败：{error.message}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
} 