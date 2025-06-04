import React, { useState } from 'react'
import { TicketList } from './TicketList'
import { TicketCreate } from './TicketCreate'
import { useGetTicketStats } from '../hooks/useTickets'

type TabType = 'list' | 'create' | 'manage'

export const TicketSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('list')
  const { data: statsData, loading: statsLoading } = useGetTicketStats()

  const stats = statsData?.ticketStats

  const formatNumber = (num: number | undefined) => {
    return num ? num.toLocaleString() : '0'
  }

  const TabButton: React.FC<{ 
    tab: TabType
    label: string
    icon: string
    isActive: boolean
    onClick: () => void
  }> = ({ tab, label, icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              票务系统
            </h1>
            
            <div className="flex space-x-4">
              <TabButton
                tab="list"
                label="票务列表"
                icon="🎫"
                isActive={activeTab === 'list'}
                onClick={() => setActiveTab('list')}
              />
              <TabButton
                tab="create"
                label="创建票务"
                icon="➕"
                isActive={activeTab === 'create'}
                onClick={() => setActiveTab('create')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 统计面板 */}
      {stats && !statsLoading && (
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总票务数</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats.totalTickets)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">已发布</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats.releasedTickets)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-lg">🎟️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">已售出</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats.totalSold)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-lg">🛒</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">可购买</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats.totalAvailable)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <div className="pb-8">
        {activeTab === 'list' && <TicketList />}
        {activeTab === 'create' && <TicketCreate />}
      </div>

      {/* API状态指示器 */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-white rounded-lg shadow-lg p-3 border">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">票务API已连接</span>
          </div>
        </div>
      </div>
    </div>
  )
} 