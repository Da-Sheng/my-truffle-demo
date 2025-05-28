// 红包详情组件 - 显示领取历史和详细信息
import React, { useState, useEffect } from 'react'
import BigNumber from 'bignumber.js'
import { useCurrentBagId, useBagInfo, useUserClaimedAmount, formatAmount } from '../hooks/useHappyBag'
import { useAccount } from 'wagmi'
import { BagInfo } from '../contracts/happyBag'
import {
  Card,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Empty,
  Badge,
  Button,
  Tooltip,
  Alert,
  Descriptions,
  Spin
} from 'antd'
import {
  GiftOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  TrophyOutlined,
  ReloadOutlined,
  TeamOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

// 领取记录类型
interface ClaimRecord {
  key: string
  user: string
  amount: BigNumber
  claimedTime: number
}

export const RedPacketDetails: React.FC = () => {
  const { address } = useAccount()
  const { data: currentBagId } = useCurrentBagId()
  const { data: bagInfo } = useBagInfo(
    currentBagId && typeof currentBagId === 'bigint' ? new BigNumber(currentBagId.toString()) : undefined
  )
  const { data: userClaimedAmount } = useUserClaimedAmount(
    currentBagId && typeof currentBagId === 'bigint' ? new BigNumber(currentBagId.toString()) : undefined,
    address
  )

  const [showAllRecords, setShowAllRecords] = useState(false)

  // 模拟领取记录 - 在实际应用中应该从区块链事件或后端获取
  const mockClaimRecords: ClaimRecord[] = [
    {
      key: '1',
      user: '0x1234567890123456789012345678901234567890',
      amount: new BigNumber(150000000000000000), // 0.15 ETH
      claimedTime: Date.now() - 3600000 // 1小时前
    },
    {
      key: '2',
      user: '0x2345678901234567890123456789012345678901',
      amount: new BigNumber(200000000000000000), // 0.2 ETH
      claimedTime: Date.now() - 1800000 // 30分钟前
    },
    {
      key: '3',
      user: '0x3456789012345678901234567890123456789012',
      amount: new BigNumber(100000000000000000), // 0.1 ETH
      claimedTime: Date.now() - 900000 // 15分钟前
    }
  ]

  // 格式化地址显示
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // 格式化时间显示
  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (hours > 0) {
      return `${hours}小时前`
    } else if (minutes > 0) {
      return `${minutes}分钟前`
    } else {
      return '刚刚'
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '排名',
      dataIndex: 'key',
      key: 'key',
      width: 80,
      render: (key: string) => (
        <Badge 
          count={key} 
          style={{ 
            backgroundColor: key === '1' ? '#f50' : key === '2' ? '#108ee9' : '#108ee9',
            fontSize: '12px'
          }}
        />
      )
    },
    {
      title: '地址',
      dataIndex: 'user',
      key: 'user',
      render: (user: string) => (
        <Space>
          <UserOutlined style={{ color: '#666' }} />
          <Text code>{formatAddress(user)}</Text>
        </Space>
      )
    },
    {
      title: '领取金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: BigNumber) => (
        <Space>
          <Typography.Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
            {formatAmount(amount)} ETH
          </Typography.Text>
        </Space>
      ),
      sorter: (a: ClaimRecord, b: ClaimRecord) => {
        const comparison = a.amount.comparedTo(b.amount)
        return comparison === null ? 0 : comparison
      },
    },
    {
      title: '时间',
      dataIndex: 'claimedTime',
      key: 'claimedTime',
      render: (claimedTime: number) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#666' }} />
          <Text type="secondary">{formatTime(claimedTime)}</Text>
        </Space>
      )
    }
  ]

  if (!currentBagId || typeof currentBagId !== 'bigint' || currentBagId === 0n) {
    return (
      <Card style={{ textAlign: 'center', minHeight: '400px' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical">
              <Title level={4} type="secondary">暂无红包详情</Title>
              <Text type="secondary">当前没有活跃的红包</Text>
            </Space>
          }
        />
      </Card>
    )
  }

  const bagData = bagInfo as BagInfo
  const totalCount = Number(bagData?.totalCount || 0)
  const remainingCount = Number(bagData?.remainingCount || 0)
  const claimedCount = totalCount - remainingCount
  const progressPercent = totalCount > 0 ? (claimedCount / totalCount) * 100 : 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 红包基本信息 */}
      {bagData && (
        <Card 
          title={
            <Space>
              <GiftOutlined style={{ color: '#f50' }} />
              <span>红包详情</span>
            </Space>
          }
          style={{ 
            background: 'linear-gradient(135deg, #fff5f5 0%, #fff0f6 100%)',
            borderRadius: '12px'
          }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="总金额"
                value={formatAmount(bagData.totalAmount)}
                suffix="ETH"
                valueStyle={{ color: '#f50', fontSize: '24px' }}
                prefix={<GiftOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="已领取"
                value={claimedCount}
                suffix={`/ ${totalCount}`}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="剩余数量"
                value={remainingCount}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>

          {/* 进度条 */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <Text strong>领取进度</Text>
              <Text type="secondary">{progressPercent.toFixed(1)}%</Text>
            </div>
            <Progress
              percent={progressPercent}
              strokeColor={{
                '0%': '#ff4d4f',
                '100%': '#ff7875'
              }}
              trailColor="#f5f5f5"
              strokeWidth={8}
              style={{ marginBottom: '16px' }}
            />
            
            <Row gutter={16}>
              <Col span={12}>
                <Tag color={bagData.isEqual ? 'blue' : 'purple'} style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {bagData.isEqual ? '平分红包' : '随机红包'}
                </Tag>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text type="secondary">
                  创建时间: {new Date(Number(bagData.startTime) * 1000).toLocaleString()}
                </Text>
              </Col>
            </Row>
          </div>
        </Card>
      )}

      {/* 用户领取状态 */}
      {address && (
        <Card 
          title={
            <Space>
              <UserOutlined />
              <span>我的领取状态</span>
            </Space>
          }
          style={{ borderRadius: '8px' }}
        >
          {userClaimedAmount && typeof userClaimedAmount === 'bigint' && userClaimedAmount > 0n ? (
            <Space size="large">
              <Badge status="success" text="已领取" />
              <Statistic
                value={formatAmount(userClaimedAmount)}
                suffix="ETH"
                valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                prefix={<TrophyOutlined />}
              />
            </Space>
          ) : (
            <Space>
              <Badge status="warning" text="尚未领取" />
              <Text type="secondary">您还没有领取这个红包</Text>
            </Space>
          )}
        </Card>
      )}

      {/* 领取记录 */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            <span>领取记录</span>
          </Space>
        }
        extra={
          <Button
            type="link"
            icon={showAllRecords ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setShowAllRecords(!showAllRecords)}
          >
            {showAllRecords ? '收起' : '查看全部'}
          </Button>
        }
        style={{ borderRadius: '8px' }}
      >
        {mockClaimRecords.length > 0 ? (
          <Table
            columns={columns}
            dataSource={mockClaimRecords.slice(0, showAllRecords ? undefined : 3)}
            rowKey="key"
            pagination={false}
            size="middle"
            style={{ marginTop: '16px' }}
          />
        ) : (
          <Empty
            description="暂无领取记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </Space>
  )
} 