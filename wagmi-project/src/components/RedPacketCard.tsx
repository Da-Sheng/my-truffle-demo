// 红包卡片组件
import React, { useState } from 'react'
import BigNumber from 'bignumber.js'
import { BagInfo, BagStatus } from '../contracts/happyBag'
import { formatAmount, useClaimBag, useBagStatus, formatBagId, useUserClaimedAmount } from '../hooks/useHappyBag'
import { useAccount } from 'wagmi'
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Progress,
  Statistic,
  Descriptions,
  Row,
  Col,
  Badge
} from 'antd'
import {
  GiftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  LoadingOutlined
} from '@ant-design/icons'

const { Text, Title } = Typography

interface RedPacketCardProps {
  bagId: BigNumber
  bagInfo: BagInfo
  isClickable?: boolean
  showDetails?: boolean
  onClaimSuccess?: () => void
}

export const RedPacketCard: React.FC<RedPacketCardProps> = ({ 
  bagId, 
  bagInfo, 
  isClickable = true,
  showDetails = false,
  onClaimSuccess
}) => {
  const { address } = useAccount()
  const { claimBag, isPending, isConfirming, isConfirmed } = useClaimBag()
  const status = useBagStatus(bagInfo, address, bagId)
  
  // 获取用户已领取金额
  const { data: userClaimedAmount } = useUserClaimedAmount(bagId, address)

  // 监听领取成功
  React.useEffect(() => {
    if (isConfirmed && onClaimSuccess) {
      onClaimSuccess()
    }
  }, [isConfirmed, onClaimSuccess])

  // 获取状态显示配置
  const getStatusConfig = (status: BagStatus) => {
    switch (status) {
      case BagStatus.AVAILABLE:
        return {
          text: '可领取',
          color: 'red' as const,
          clickable: true,
          icon: <GiftOutlined />
        }
      case BagStatus.WAITING:
        return {
          text: '等待中',
          color: 'default' as const,
          clickable: false,
          icon: <ClockCircleOutlined />
        }
      case BagStatus.COMPLETED:
        return {
          text: '已领取',
          color: 'green' as const,
          clickable: false,
          icon: <CheckCircleOutlined />
        }
      case BagStatus.PENDING_DEPOSIT:
        return {
          text: '待充值',
          color: 'orange' as const,
          clickable: false,
          icon: <DollarOutlined />
        }
    }
  }

  const statusConfig = getStatusConfig(status)
  const canClick = isClickable && statusConfig.clickable && !isPending && !isConfirming

  const handleClick = () => {
    if (canClick) {
      claimBag()
    }
  }

  // 计算进度
  const totalCount = Number(bagInfo.totalCount)
  const remainingCount = Number(bagInfo.remainingCount)
  const claimedCount = totalCount - remainingCount
  const progressPercent = totalCount > 0 ? (claimedCount / totalCount) * 100 : 0

  // 格式化用户已领金额
  const formatUserClaimedAmount = () => {
    if (!userClaimedAmount || typeof userClaimedAmount !== 'bigint' || userClaimedAmount === 0n) return '0'
    return formatAmount(userClaimedAmount)
  }

  // 检查用户是否已领取
  const hasUserClaimed = userClaimedAmount && typeof userClaimedAmount === 'bigint' && userClaimedAmount > 0n

  return (
    <div style={{ marginBottom: '16px' }}>
      <Badge.Ribbon 
        text={
          <Space>
            {statusConfig.icon}
            {statusConfig.text}
            {/* 在已领取状态下显示领取金额 */}
            {status === BagStatus.COMPLETED && hasUserClaimed && (
              <>({formatUserClaimedAmount()} ETH)</>
            )}
          </Space>
        } 
        color={statusConfig.color}
      >
        <Card
          hoverable={canClick}
          style={{
            borderRadius: '12px',
            background: status === BagStatus.AVAILABLE 
              ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' 
              : status === BagStatus.COMPLETED
              ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
              : undefined,
            color: (status === BagStatus.AVAILABLE || status === BagStatus.COMPLETED) ? 'white' : undefined,
            cursor: canClick ? 'pointer' : 'default',
            opacity: isPending || isConfirming ? 0.7 : 1
          }}
          onClick={handleClick}
          bodyStyle={{ padding: '20px' }}
        >
          <div style={{ position: 'relative', minHeight: '120px' }}>
            {/* 红包主要信息 */}
            <Row gutter={[16, 16]} align="middle">
              <Col span={12}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '32px', 
                      marginBottom: '8px',
                      filter: (status === BagStatus.AVAILABLE || status === BagStatus.COMPLETED) 
                        ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : undefined 
                    }}>
                      {status === BagStatus.COMPLETED ? '🎉' : '🧧'}
                    </div>
                    {/* 显示不同的金额信息 */}
                    {status === BagStatus.COMPLETED && hasUserClaimed ? (
                      <div>
                        <Text strong style={{ 
                          fontSize: '18px',
                          color: 'white'
                        }}>
                          我的收益: {formatUserClaimedAmount()} ETH
                        </Text>
                        <div style={{ marginTop: '4px' }}>
                          <Text style={{ 
                            fontSize: '12px',
                            color: 'rgba(255,255,255,0.8)'
                          }}>
                            剩余: {formatAmount(bagInfo.remainingAmount)} ETH
                          </Text>
                        </div>
                      </div>
                    ) : (
                      <Text strong style={{ 
                        fontSize: '18px',
                        color: (status === BagStatus.AVAILABLE || status === BagStatus.COMPLETED) ? 'white' : undefined 
                      }}>
                        {formatAmount(bagInfo.remainingAmount)} ETH
                      </Text>
                    )}
                  </div>
                </Space>
              </Col>
              
              <Col span={12}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Statistic
                    title={
                      <Text style={{ 
                        color: (status === BagStatus.AVAILABLE || status === BagStatus.COMPLETED) 
                          ? 'rgba(255,255,255,0.8)' : '#666',
                        fontSize: '12px'
                      }}>
                        剩余数量
                      </Text>
                    }
                    value={remainingCount}
                    suffix={`/ ${totalCount}`}
                    valueStyle={{ 
                      color: (status === BagStatus.AVAILABLE || status === BagStatus.COMPLETED) ? 'white' : '#1890ff',
                      fontSize: '16px'
                    }}
                  />
                  
                  <Progress
                    percent={progressPercent}
                    size="small"
                    strokeColor={(status === BagStatus.AVAILABLE || status === BagStatus.COMPLETED) ? '#fff' : undefined}
                    trailColor={(status === BagStatus.AVAILABLE || status === BagStatus.COMPLETED) ? 'rgba(255,255,255,0.3)' : undefined}
                    showInfo={false}
                  />
                  
                  <Tag color={bagInfo.isEqual ? 'blue' : 'purple'}>
                    {bagInfo.isEqual ? '平分' : '随机'}
                  </Tag>
                </Space>
              </Col>
            </Row>

            {/* 加载状态覆盖层 */}
            {(isPending || isConfirming) && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                zIndex: 1
              }}>
                <Space>
                  <LoadingOutlined style={{ color: 'white', fontSize: '20px' }} />
                  <Text style={{ color: 'white' }}>
                    {isPending ? '确认中...' : '处理中...'}
                  </Text>
                </Space>
              </div>
            )}

            {/* 操作按钮 */}
            {canClick && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Button
                  type={status === BagStatus.AVAILABLE ? 'default' : 'primary'}
                  size="large"
                  icon={<GiftOutlined />}
                  loading={isPending || isConfirming}
                  disabled={!canClick}
                  style={{
                    borderRadius: '8px',
                    background: status === BagStatus.AVAILABLE ? 'rgba(255,255,255,0.9)' : undefined,
                    color: status === BagStatus.AVAILABLE ? '#ff4d4f' : undefined,
                    border: status === BagStatus.AVAILABLE ? 'none' : undefined,
                    fontWeight: 'bold'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick()
                  }}
                >
                  立即领取
                </Button>
              </div>
            )}
          </div>
        </Card>
      </Badge.Ribbon>

      {/* 详细信息展示 */}
      {showDetails && (
        <Card 
          size="small" 
          style={{ 
            marginTop: '8px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="红包ID">
              <Text code>#{formatBagId(bagId)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="总金额">
              {formatAmount(bagInfo.totalAmount)} ETH
            </Descriptions.Item>
            <Descriptions.Item label="创建者">
              <Text code>
                {bagInfo.creator.slice(0, 6)}...{bagInfo.creator.slice(-4)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(Number(bagInfo.startTime) * 1000).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  )
} 