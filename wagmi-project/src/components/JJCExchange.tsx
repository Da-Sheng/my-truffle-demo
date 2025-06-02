import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  message,
  Spin,
  Alert
} from 'antd'
import { 
  SwapOutlined, 
  InfoCircleOutlined,
  DollarOutlined,
  MoneyCollectOutlined 
} from '@ant-design/icons'
import { useTokenPrice, useBuyJJC, formatJJCAmount } from '../hooks/useJJCoin'

const { Text } = Typography

interface JJCExchangeProps {
  title?: string
  size?: 'small' | 'default'
  showRate?: boolean
  onExchangeSuccess?: () => void
}

export const JJCExchange: React.FC<JJCExchangeProps> = ({
  title = "兑换JJC",
  size = 'default',
  showRate = true,
  onExchangeSuccess
}) => {
  const [ethAmount, setEthAmount] = useState<string>('')

  // 获取当前代币价格
  const { data: tokenPrice, isLoading: priceLoading } = useTokenPrice()
  
  // 兑换JJC的hooks
  const { 
    buyJJC, 
    hash, 
    isPending, 
    isConfirming, 
    isConfirmed, 
    error 
  } = useBuyJJC()

  const minExchange = 0.001 // 最小兑换金额
  
  // 计算兑换汇率和JJC数量
  const tokenPriceInEth = tokenPrice ? Number(formatJJCAmount(tokenPrice as bigint)) : 0.0004
  const exchangeRate = tokenPriceInEth ? 1 / tokenPriceInEth : 2500  // 1 ETH 能兑换多少 JJC
  const jjcAmount = ethAmount ? (parseFloat(ethAmount) * exchangeRate).toString() : '0'

  // 监听交易完成
  useEffect(() => {
    if (isConfirmed) {
      message.success('JJC兑换成功！')
      setEthAmount('')
      onExchangeSuccess?.()
    }
  }, [isConfirmed, onExchangeSuccess])

  // 监听交易错误
  useEffect(() => {
    if (error) {
      console.error('兑换失败:', error)
      message.error(`兑换失败: ${error.message || '未知错误'}`)
    }
  }, [error])

  const handleExchange = async () => {
    if (!ethAmount || parseFloat(ethAmount) < minExchange) {
      message.error(`最小兑换金额为 ${minExchange} ETH`)
      return
    }

    try {
      buyJJC(ethAmount)
    } catch (error) {
      console.error('发起兑换失败:', error)
      message.error('发起兑换失败，请重试')
    }
  }

  const isLoading = isPending || isConfirming

  return (
    <Card 
      title={
        <Space>
          <SwapOutlined />
          {title}
        </Space>
      }
      size={size}
      style={{ borderRadius: '12px' }}
    >
      {showRate && (
        <Alert
          message={
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="当前汇率"
                  value={priceLoading ? 0 : exchangeRate}
                  suffix="JJC/ETH"
                  precision={0}
                  valueStyle={{ fontSize: '16px' }}
                  loading={priceLoading}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="最小兑换"
                  value={minExchange}
                  suffix="ETH"
                  precision={3}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
            </Row>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '24px' }}
        />
      )}

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* ETH输入 */}
        <div>
          <Text strong style={{ marginBottom: '8px', display: 'block' }}>
            <DollarOutlined /> 支付ETH数量
          </Text>
          <Input
            size="large"
            placeholder={`最少 ${minExchange} ETH`}
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            suffix="ETH"
            type="number"
            min={minExchange}
            step={0.001}
            disabled={isLoading}
          />
        </div>

        {/* 兑换图标 */}
        <div style={{ textAlign: 'center' }}>
          <SwapOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
        </div>

        {/* JJC输出 */}
        <div>
          <Text strong style={{ marginBottom: '8px', display: 'block' }}>
            <MoneyCollectOutlined /> 获得JJC数量
          </Text>
          <Input
            size="large"
            value={jjcAmount}
            suffix="JJC"
            readOnly
            style={{ 
              backgroundColor: '#f5f5f5',
              color: '#1890ff',
              fontWeight: 'bold'
            }}
          />
        </div>

        {/* 交易状态提示 */}
        {hash && (
          <Alert
            message={
              isConfirming 
                ? "交易确认中，请等待区块链确认..." 
                : "交易已提交，正在处理..."
            }
            type="info"
            showIcon
          />
        )}

        {/* 兑换按钮 */}
        <Button
          type="primary"
          size="large"
          block
          icon={isLoading ? <Spin size="small" /> : <SwapOutlined />}
          loading={isLoading}
          onClick={handleExchange}
          disabled={!ethAmount || parseFloat(ethAmount) < minExchange || priceLoading}
        >
          {isConfirming ? '确认中...' : isPending ? '交易中...' : '立即兑换'}
        </Button>
      </Space>
    </Card>
  )
}