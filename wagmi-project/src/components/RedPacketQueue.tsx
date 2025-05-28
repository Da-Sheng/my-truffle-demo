// 红包队列组件 - 管理红包的显示队列
import React, { useState, useEffect } from 'react'
import { useCurrentBagId, useBagInfo } from '../hooks/useHappyBag'
import { RedPacketCard } from './RedPacketCard'
import { BagInfo, happyBagConfig } from '../contracts/happyBag'
import { useQueryClient } from '@tanstack/react-query'
import { useAccount, useChainId } from 'wagmi'
import {
  Card,
  Button,
  Alert,
  Space,
  Typography,
  Empty,
  Spin,
  Descriptions,
  Badge,
  Row,
  Col,
  Divider,
  Tag
} from 'antd'
import {
  ReloadOutlined,
  GiftOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  BugOutlined
} from '@ant-design/icons'
import BigNumber from 'bignumber.js'

const { Title, Text } = Typography

// 队列项目类型
interface QueueItem {
  id: BigNumber
  info: BagInfo
  position: number
}

export const RedPacketQueue: React.FC = () => {
  const queryClient = useQueryClient()
  const [bagQueue, setBagQueue] = useState<QueueItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  // 添加网络和账户状态检查
  const account = useAccount()
  const chainId = useChainId()

  // 从合约获取数据
  const { 
    data: currentBagId, 
    isLoading: isLoadingBagId, 
    error: bagIdError,
    refetch: refetchBagId 
  } = useCurrentBagId()
  
  const { 
    data: bagInfo, 
    isLoading: isLoadingBagInfo,
    error: bagInfoError,
    refetch: refetchBagInfo 
  } = useBagInfo(currentBagId ? new BigNumber(currentBagId.toString()) : undefined)

  // 转换为安全的BagInfo格式
  const getSafeBagInfo = (rawBagInfo: any): BagInfo | null => {
    if (!rawBagInfo) return null
    
    try {
      return {
        totalAmount: new BigNumber(rawBagInfo.totalAmount?.toString() || '0'),
        totalCount: new BigNumber(rawBagInfo.totalCount?.toString() || '0'),
        remainingCount: new BigNumber(rawBagInfo.remainingCount?.toString() || '0'),
        remainingAmount: new BigNumber(rawBagInfo.remainingAmount?.toString() || '0'),
        startTime: new BigNumber(rawBagInfo.startTime?.toString() || '0'),
        creator: rawBagInfo.creator || '',
        isActive: Boolean(rawBagInfo.isActive),
        isEqual: Boolean(rawBagInfo.isEqual)
      }
    } catch (error) {
      console.error('转换BagInfo失败:', error)
      return null
    }
  }

  const safeBagInfo = getSafeBagInfo(bagInfo)

  // 调试日志
  React.useEffect(() => {
    console.log('🔍 Debug Info:')
    console.log('currentBagId:', currentBagId, 'type:', typeof currentBagId)
    console.log('bagIdLoading:', isLoadingBagId)
    console.log('bagIdError:', bagIdError)
    console.log('currentBagInfo:', bagInfo)
    console.log('bagInfoError:', bagInfoError)
  }, [currentBagId, isLoadingBagId, bagIdError, bagInfo, bagInfoError])
  
  // 强力刷新数据
  const refreshData = async () => {
    setRefreshing(true)
    try {
      // 清除查询缓存
      await queryClient.invalidateQueries({ queryKey: ['readContract'] })
      
      // 重新获取数据
      await Promise.all([
        refetchBagId(),
        refetchBagInfo()
      ])
      
      console.log('数据刷新完成')
    } catch (error) {
      console.error('数据刷新失败:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // 自动刷新机制 - 每30秒检查一次
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoadingBagId && !isLoadingBagInfo && !refreshing) {
        refreshData()
      }
    }, 30000) // 30秒

    return () => clearInterval(interval)
  }, [isLoadingBagId, isLoadingBagInfo, refreshing])

  // 构建队列数据
  useEffect(() => {
    const newQueue: QueueItem[] = []
    
    // 添加当前活跃的红包
    if (currentBagId && typeof currentBagId === 'bigint' && currentBagId > 0n && safeBagInfo) {
      const currentBagIdBN = new BigNumber(currentBagId.toString())
      if (currentBagIdBN.isGreaterThan(0)) {
        newQueue.push({
          id: currentBagIdBN,
          info: safeBagInfo,
          position: 1
        })
      }
    }
    
    // 模拟队列中的其他红包（实际项目中应该从合约获取）
    if (newQueue.length === 0) {
      // 模拟数据，仅用于演示
      const mockBagInfo: BagInfo = {
        totalAmount: new BigNumber('1000000000000000000'), // 1 ETH in wei
        totalCount: new BigNumber('5'),
        remainingCount: new BigNumber('3'),
        remainingAmount: new BigNumber('600000000000000000'), // 0.6 ETH in wei
        startTime: new BigNumber(Math.floor(Date.now() / 1000) + 3600), // 1小时后
        creator: '0x1234...5678',
        isActive: true,
        isEqual: false
      }
    }

    setBagQueue(newQueue)
  }, [currentBagId, safeBagInfo])

  // 处理红包领取成功后的刷新
  const handleClaimSuccess = () => {
    setTimeout(() => {
      refreshData()
    }, 2000) // 2秒后刷新数据
  }

  // 判断是否有活跃红包
  const hasActiveBag = currentBagId && typeof currentBagId === 'bigint' && currentBagId > 0n && safeBagInfo?.isActive

  if (!hasActiveBag) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Card
          title={
            <Space>
              <GiftOutlined />
              红包队列
            </Space>
          }
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshData}
              loading={refreshing || isLoadingBagId}
              type="primary"
              style={{ borderRadius: '6px' }}
            >
              {refreshing || isLoadingBagId ? '刷新中...' : '刷新'}
            </Button>
          }
          style={{ borderRadius: '12px' }}
        >
          {/* 调试信息区域 */}
          <Alert
            message="调试信息"
            description={
              <Descriptions size="small" column={1} bordered style={{ marginTop: '8px' }}>
                <Descriptions.Item label="currentBagId">
                  <Space>
                    <Text code>{currentBagId ? currentBagId.toString() : 'null/undefined'}</Text>
                    <Tag color="blue">类型: {typeof currentBagId}</Tag>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="加载状态">
                  <Badge status={isLoadingBagId ? "processing" : "success"} text={isLoadingBagId ? '加载中' : '已完成'} />
                </Descriptions.Item>
                {bagIdError && (
                  <Descriptions.Item label="错误信息">
                    <Text type="danger">{bagIdError.message}</Text>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="合约地址">
                  <Text code>{happyBagConfig.address}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="当前网络ID">
                  <Tag color={chainId === 1337 ? "green" : "red"}>{chainId}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="账户状态">
                  <Space>
                    <Badge status={account.status === 'connected' ? "success" : "default"} text={account.status} />
                    {account.address && (
                      <Text code>{account.address.slice(0, 6)}...{account.address.slice(-4)}</Text>
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            }
            type="warning"
            icon={<BugOutlined />}
            style={{ marginBottom: '24px', borderRadius: '8px' }}
            showIcon
          />

          {account.status === 'connected' && chainId !== 1337 && (
            <Alert
              message="网络警告"
              description="当前网络不是本地开发网络 (Chain ID: 1337)，请切换到正确的网络"
              type="error"
              style={{ marginBottom: '24px', borderRadius: '8px' }}
              showIcon
            />
          )}
          
          <Empty
            image="🧧"
            imageStyle={{ fontSize: '64px', height: '80px' }}
            description={
              <Space direction="vertical" size="small">
                <Title level={4} type="secondary">暂无活跃红包</Title>
                <Text type="secondary">等待有人创建新的红包...</Text>
                <Text style={{ fontSize: '12px', color: '#999' }}>
                  如果刚刚创建了红包，请点击刷新按钮或稍等片刻
                </Text>
              </Space>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <GiftOutlined />
            红包队列
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={refreshData}
            loading={refreshing || isLoadingBagId || isLoadingBagInfo}
            type="primary"
            style={{ borderRadius: '6px' }}
          >
            {refreshing || isLoadingBagId || isLoadingBagInfo ? '刷新中...' : '刷新'}
          </Button>
        }
        style={{ borderRadius: '12px' }}
      >
        {/* 队列说明 */}
        <Alert
          message="队列规则"
          description={
            <div>
              <p>• 红包按照创建时间顺序排列</p>
              <p>• 只有当前红包可以领取，其他红包处于等待状态</p>
              <p>• 当前红包被领完后，下一个红包自动激活</p>
              <p>• 每个地址只能领取一次当前红包</p>
            </div>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '24px', borderRadius: '8px' }}
          showIcon
        />

        {/* 红包队列列表 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>当前队列</Title>
          
          {bagQueue.length > 0 ? (
            <Row gutter={[16, 16]}>
              {bagQueue.map((queuedBag) => (
                <Col xs={24} lg={12} key={queuedBag.id.toString()}>
                  <div style={{ position: 'relative' }}>
                    {queuedBag.position === 0 && (
                      <Badge.Ribbon text="正在进行" color="red">
                        <RedPacketCard
                          bagId={queuedBag.id}
                          bagInfo={queuedBag.info}
                          onClaimSuccess={handleClaimSuccess}
                        />
                      </Badge.Ribbon>
                    )}
                    {queuedBag.position > 0 && (
                      <Badge.Ribbon text={`排队中 #${queuedBag.position + 1}`} color="gray">
                        <Card
                          style={{ 
                            opacity: 0.6,
                            borderRadius: '12px',
                            border: '1px dashed #d9d9d9'
                          }}
                        >
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧧</div>
                              <Text strong>等待中的红包</Text>
                            </div>
                            <Descriptions size="small" column={1}>
                              <Descriptions.Item label="红包ID">
                                #{queuedBag.id.toString()}
                              </Descriptions.Item>
                              <Descriptions.Item label="总金额">
                                {(Number(queuedBag.info.totalAmount) / 10**18).toFixed(4)} ETH
                              </Descriptions.Item>
                              <Descriptions.Item label="数量">
                                {queuedBag.info.totalCount.toString()} 个
                              </Descriptions.Item>
                              <Descriptions.Item label="状态">
                                <Tag color="default">等待激活</Tag>
                              </Descriptions.Item>
                            </Descriptions>
                          </Space>
                        </Card>
                      </Badge.Ribbon>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="队列为空" />
          )}
        </div>

        {/* 统计信息 */}
        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Spin spinning={isLoadingBagId}>
                <div style={{ fontSize: '24px', color: '#1890ff' }}>
                  {currentBagId ? currentBagId.toString() : '0'}
                </div>
                <Text type="secondary">当前红包ID</Text>
              </Spin>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', color: '#52c41a' }}>
                {bagQueue.length}
              </div>
              <Text type="secondary">队列长度</Text>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', color: '#fa541c' }}>
                {bagQueue.filter(bag => bag.info.isActive).length}
              </div>
              <Text type="secondary">活跃红包</Text>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', color: '#722ed1' }}>
                {bagQueue.reduce((total, bag) => 
                  total + Number(bag.info.remainingCount), 0
                )}
              </div>
              <Text type="secondary">剩余总数</Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
} 