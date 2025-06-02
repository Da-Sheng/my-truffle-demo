import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Space, 
  Typography, 
  Input, 
  Modal, 
  message,
  Divider,
  Alert,
  Tag,
  Tabs
} from 'antd'
import { 
  BankOutlined,
  MoneyCollectOutlined,
  SwapOutlined,
  CrownOutlined,
  PlusOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { JJCExchange } from './JJCExchange'
import { 
  useJJCBalance, 
  useTokenPrice, 
  useContractJJCBalance, 
  useIsOwner, 
  useAddSupply, 
  useUpdatePrice, 
  formatJJCAmount 
} from '../hooks/useJJCoin'
import { useAccount } from 'wagmi'

const { Title, Text } = Typography
const { TabPane } = Tabs

export const JJCoinManager: React.FC = () => {
  // 钱包信息
  const { address } = useAccount()
  
  // 状态管理
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [priceModalVisible, setPriceModalVisible] = useState(false)
  const [addAmount, setAddAmount] = useState<string>('')
  const [newPrice, setNewPrice] = useState<string>('')

  // 合约数据
  const { data: userBalance } = useJJCBalance(address)
  const { data: tokenPrice } = useTokenPrice()
  const { data: contractBalance } = useContractJJCBalance()
  const { data: isOwner = false } = useIsOwner()

  // 管理员操作hooks
  const { 
    addSupply, 
    hash: addHash, 
    isPending: addPending, 
    isConfirming: addConfirming, 
    isConfirmed: addConfirmed, 
    error: addError 
  } = useAddSupply()

  const { 
    updatePrice, 
    hash: priceHash, 
    isPending: pricePending, 
    isConfirming: priceConfirming, 
    isConfirmed: priceConfirmed, 
    error: priceError 
  } = useUpdatePrice()

  // 监听添加供应量完成
  useEffect(() => {
    if (addConfirmed) {
      message.success('JJC供应量添加成功！')
      setAddModalVisible(false)
      setAddAmount('')
    }
  }, [addConfirmed])

  // 监听价格更新完成
  useEffect(() => {
    if (priceConfirmed) {
      message.success('价格更新成功！')
      setPriceModalVisible(false)
      setNewPrice('')
    }
  }, [priceConfirmed])

  // 监听操作错误
  useEffect(() => {
    if (addError) {
      message.error(`添加供应量失败: ${addError.message || '未知错误'}`)
    }
  }, [addError])

  useEffect(() => {
    if (priceError) {
      message.error(`价格更新失败: ${priceError.message || '未知错误'}`)
    }
  }, [priceError])

  // 添加JJC供应量（仅OWNER）
  const handleAddSupply = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      message.error('请输入有效的数量')
      return
    }

    try {
      addSupply(addAmount)
    } catch (error) {
      console.error('发起添加供应量失败:', error)
      message.error('发起添加供应量失败，请重试')
    }
  }

  // 调整价格（仅OWNER）
  const handleUpdatePrice = async () => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      message.error('请输入有效的价格')
      return
    }

    try {
      updatePrice(newPrice)
    } catch (error) {
      console.error('发起价格更新失败:', error)
      message.error('发起价格更新失败，请重试')
    }
  }

  // 格式化显示数据
  const formattedUserBalance = userBalance ? formatJJCAmount(userBalance as bigint) : '0'
  const formattedContractBalance = contractBalance ? formatJJCAmount(contractBalance as bigint) : '0'
  const formattedTokenPrice = tokenPrice ? formatJJCAmount(tokenPrice as bigint) : '0'

  const isAddLoading = addPending || addConfirming
  const isPriceLoading = pricePending || priceConfirming

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>
            <MoneyCollectOutlined /> JJCoin 代币管理
          </Title>
          <Text type="secondary">
            管理JJC代币的发行、定价和兑换
          </Text>
        </div>

        {/* 代币概览 */}
        <Card 
          title={
            <Space>
              <BankOutlined />
              代币概览
            </Space>
          }
          style={{ borderRadius: '12px' }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={8}>
              <Statistic
                title="我的JJC余额"
                value={formattedUserBalance}
                suffix="JJC"
                valueStyle={{ color: '#3f8600' }}
                precision={4}
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Statistic
                title="合约JJC余额"
                value={formattedContractBalance}
                suffix="JJC"
                valueStyle={{ color: '#1890ff' }}
                precision={4}
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Statistic
                title="当前价格"
                value={formattedTokenPrice}
                suffix="JJC/ETH"
                valueStyle={{ color: '#722ed1' }}
                precision={0}
              />
            </Col>
          </Row>

          {isOwner && (
            <>
              <Divider />
              <Alert
                message="管理员权限"
                description="您拥有合约所有者权限，可以管理代币供应量和价格"
                type="success"
                icon={<CrownOutlined />}
              />
            </>
          )}
        </Card>

        <Tabs defaultActiveKey="exchange" type="card">
          {/* 兑换JJC标签页 */}
          <TabPane 
            tab={
              <Space>
                <SwapOutlined />
                兑换JJC
              </Space>
            } 
            key="exchange"
          >
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <JJCExchange 
                  title="购买JJC代币"
                  onExchangeSuccess={() => {
                    console.log('兑换成功，数据将自动刷新')
                  }}
                />
              </Col>
              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <InfoCircleOutlined />
                      兑换说明
                    </Space>
                  }
                  style={{ borderRadius: '12px', height: '100%' }}
                >
                  <Space direction="vertical" size="middle">
                    <Alert
                      message="兑换规则"
                      description={
                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                          <li>当前汇率：{formattedTokenPrice} JJC = 1 ETH</li>
                          <li>最小兑换金额：0.001 ETH</li>
                          <li>交易手续费：Gas费用</li>
                          <li>兑换立即到账</li>
                        </ul>
                      }
                      type="info"
                    />
                    
                    <Alert
                      message="注意事项"
                      description={
                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                          <li>请确保钱包中有足够的ETH</li>
                          <li>兑换过程不可逆，请仔细确认</li>
                          <li>代币价格可能会波动</li>
                          <li>建议先小额测试</li>
                        </ul>
                      }
                      type="warning"
                    />
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* OWNER管理标签页 */}
          {isOwner && (
            <TabPane 
              tab={
                <Space>
                  <CrownOutlined />
                  管理员操作
                  <Tag color="gold">OWNER</Tag>
                </Space>
              } 
              key="admin"
            >
              <Alert
                message="管理员权限"
                description="您拥有合约所有者权限，可以执行以下管理操作"
                type="success"
                icon={<CrownOutlined />}
                style={{ marginBottom: '24px' }}
              />

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Card 
                    title="增加供应量"
                    style={{ borderRadius: '12px' }}
                    extra={
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => setAddModalVisible(true)}
                        loading={isAddLoading}
                      >
                        添加JJC
                      </Button>
                    }
                  >
                    <Text type="secondary">
                      向合约中添加更多JJC代币供应量，用于后续销售
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      当前合约余额：{formattedContractBalance} JJC
                    </Text>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card 
                    title="调整价格"
                    style={{ borderRadius: '12px' }}
                    extra={
                      <Button 
                        type="primary" 
                        icon={<SettingOutlined />}
                        onClick={() => setPriceModalVisible(true)}
                        loading={isPriceLoading}
                      >
                        调整价格
                      </Button>
                    }
                  >
                    <Text type="secondary">
                      调整JJC代币的兑换价格，影响后续交易汇率
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      当前价格：{formattedTokenPrice} JJC/ETH
                    </Text>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          )}
        </Tabs>
      </Space>

      {/* 添加供应量模态框 */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            添加JJC供应量
          </Space>
        }
        open={addModalVisible}
        onOk={handleAddSupply}
        onCancel={() => setAddModalVisible(false)}
        confirmLoading={isAddLoading}
        okText="确认添加"
        cancelText="取消"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>请输入要添加的JJC数量：</Text>
          <Input
            size="large"
            placeholder="请输入JJC数量"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            suffix="JJC"
            type="number"
            min={1}
          />
          <Alert
            message="添加供应量后，新增的JJC将可用于兑换销售"
            type="info"
          />
          {addHash && (
            <Alert
              message={
                addConfirming 
                  ? "交易确认中，请等待区块链确认..." 
                  : "交易已提交，正在处理..."
              }
              type="info"
              showIcon
            />
          )}
        </Space>
      </Modal>

      {/* 调整价格模态框 */}
      <Modal
        title={
          <Space>
            <SettingOutlined />
            调整JJC价格
          </Space>
        }
        open={priceModalVisible}
        onOk={handleUpdatePrice}
        onCancel={() => setPriceModalVisible(false)}
        confirmLoading={isPriceLoading}
        okText="确认调整"
        cancelText="取消"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>请输入新的价格（JJC per ETH）：</Text>
          <Input
            size="large"
            placeholder="请输入价格"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            suffix="JJC/ETH"
            type="number"
            min={1}
          />
          <Alert
            message={`当前价格：${formattedTokenPrice} JJC/ETH`}
            description="价格调整将影响后续所有兑换交易"
            type="warning"
          />
          {priceHash && (
            <Alert
              message={
                priceConfirming 
                  ? "交易确认中，请等待区块链确认..." 
                  : "交易已提交，正在处理..."
              }
              type="info"
              showIcon
            />
          )}
        </Space>
      </Modal>
    </div>
  )
}