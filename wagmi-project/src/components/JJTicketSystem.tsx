import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Space, 
  Typography, 
  Input, 
  Modal, 
  message,
  Table,
  Tag,
  Divider,
  Alert,
  Form,
  DatePicker,
  InputNumber,
  Select,
  Badge,
  Tabs,
  Statistic
} from 'antd'
import { 
  ShoppingCartOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SwapOutlined,
  CarryOutOutlined,
  EnvironmentOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { JJCExchange } from './JJCExchange'
import { useJJCBalance, useTransferJJC, formatJJCAmount } from '../hooks/useJJCoin'
import { useAccount } from 'wagmi'
import { JJCOIN_ADDRESS } from '../contracts/jjCoin'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs
const { TextArea } = Input

// 票务接口定义
interface Ticket {
  id: string
  title: string
  description: string
  venue: string
  eventDate: string
  price: number // JJC价格
  totalQuantity: number
  remainingQuantity: number
  category: string
  status: 'active' | 'sold_out' | 'ended'
  createdAt: string
  imageUrl?: string
  hash?: string // 链上存储的hash
}

// 购票记录接口
interface Purchase {
  id: string
  ticketId: string
  buyerAddress: string
  quantity: number
  totalPrice: number
  purchaseDate: string
  status: 'confirmed' | 'pending'
  txHash?: string // 交易hash
}

export const JJTicketSystem: React.FC = () => {
  // 钱包信息
  const { address } = useAccount()
  
  // 状态管理
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  // JJC余额查询
  const { data: jjcBalance } = useJJCBalance(address)
  
  // JJC转账hooks
  const {
    transferJJC,
    hash: transferHash,
    isPending: transferPending,
    isConfirming: transferConfirming,
    isConfirmed: transferConfirmed,
    error: transferError
  } = useTransferJJC()
  
  // 计算格式化的余额
  const formattedBalance = jjcBalance ? parseFloat(formatJJCAmount(jjcBalance as bigint)) : 0

  // 从localStorage加载数据
  useEffect(() => {
    const storedTickets = localStorage.getItem('jj_tickets')
    const storedPurchases = localStorage.getItem('jj_purchases')
    
    if (storedTickets) {
      setTickets(JSON.parse(storedTickets))
    }
    if (storedPurchases) {
      setPurchases(JSON.parse(storedPurchases))
    }
  }, [])

  // 监听转账完成
  useEffect(() => {
    if (transferConfirmed && selectedTicket) {
      // 创建购买记录
      const newPurchase: Purchase = {
        id: Date.now().toString(),
        ticketId: selectedTicket.id,
        buyerAddress: address || '',
        quantity: purchaseQuantity,
        totalPrice: selectedTicket.price * purchaseQuantity,
        purchaseDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        status: 'confirmed',
        txHash: transferHash
      }

      // 更新票务剩余数量
      const updatedTickets = tickets.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { 
              ...ticket, 
              remainingQuantity: ticket.remainingQuantity - purchaseQuantity,
              status: ticket.remainingQuantity - purchaseQuantity === 0 ? 'sold_out' as const : ticket.status
            }
          : ticket
      )

      const newPurchases = [...purchases, newPurchase]

      setTickets(updatedTickets)
      setPurchases(newPurchases)
      saveToStorage(updatedTickets, newPurchases)

      message.success('购票成功！JJC代币已转账')
      setPurchaseModalVisible(false)
      setPurchaseQuantity(1)
      setSelectedTicket(null)
    }
  }, [transferConfirmed, selectedTicket, address, purchaseQuantity, tickets, purchases, transferHash])

  // 监听转账错误
  useEffect(() => {
    if (transferError) {
      console.error('JJC转账失败:', transferError)
      message.error(`购票失败: ${transferError.message || '未知错误'}`)
      setLoading(false)
    }
  }, [transferError])

  // 保存到localStorage
  const saveToStorage = (newTickets: Ticket[], newPurchases?: Purchase[]) => {
    localStorage.setItem('jj_tickets', JSON.stringify(newTickets))
    if (newPurchases) {
      localStorage.setItem('jj_purchases', JSON.stringify(newPurchases))
    }
  }

  // 创建票务
  const handleCreateTicket = async (values: any) => {
    setLoading(true)
    try {
      const newTicket: Ticket = {
        id: Date.now().toString(),
        title: values.title,
        description: values.description,
        venue: values.venue,
        eventDate: values.eventDate.format('YYYY-MM-DD HH:mm'),
        price: values.price,
        totalQuantity: values.quantity,
        remainingQuantity: values.quantity,
        category: values.category,
        status: 'active',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        hash: `0x${Date.now().toString(16)}` // 模拟hash
      }

      const newTickets = [...tickets, newTicket]
      setTickets(newTickets)
      saveToStorage(newTickets, purchases)

      // TODO: 将hash存储到区块链
      console.log('票务创建成功，hash:', newTicket.hash)

      message.success('票务创建成功！')
      setCreateModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('创建票务失败:', error)
      message.error('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 购买票务 - 使用真实的JJC转账
  const handlePurchaseTicket = async () => {
    if (!selectedTicket || !address) return

    const totalPrice = selectedTicket.price * purchaseQuantity

    if (totalPrice > formattedBalance) {
      message.error('JJC余额不足，请先兑换JJC')
      return
    }

    if (purchaseQuantity > selectedTicket.remainingQuantity) {
      message.error('购买数量超过剩余票数')
      return
    }

    setLoading(true)
    try {
      // TODO: 这里应该转账给票务系统的合约地址，暂时使用JJCoin合约地址作为示例
      transferJJC(JJCOIN_ADDRESS, totalPrice.toString())
      
      console.log('发起JJC转账:', {
        to: JJCOIN_ADDRESS,
        amount: totalPrice,
        ticketId: selectedTicket.id
      })

    } catch (error) {
      console.error('发起购票失败:', error)
      message.error('发起购票失败，请重试')
      setLoading(false)
    }
  }

  const isPurchaseLoading = loading || transferPending || transferConfirming

  // 票务列表列定义
  const ticketColumns = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Ticket) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Hash: {record.hash?.slice(0, 10)}...
          </Text>
        </div>
      )
    },
    {
      title: '时间地点',
      key: 'info',
      render: (record: Ticket) => (
        <div>
          <div>
            <CalendarOutlined /> {record.eventDate}
          </div>
          <div>
            <EnvironmentOutlined /> {record.venue}
          </div>
        </div>
      )
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {price} JJC
        </Text>
      )
    },
    {
      title: '库存',
      key: 'stock',
      render: (record: Ticket) => (
        <div>
          <Badge 
            count={record.remainingQuantity} 
            overflowCount={999}
            style={{ backgroundColor: record.remainingQuantity > 0 ? '#52c41a' : '#ff4d4f' }}
          />
          <Text type="secondary"> / {record.totalQuantity}</Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          active: { color: 'green', text: '正在销售' },
          sold_out: { color: 'red', text: '售罄' },
          ended: { color: 'default', text: '已结束' }
        }
        const config = statusMap[status as keyof typeof statusMap]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Ticket) => (
        <Button
          type="primary"
          size="small"
          disabled={record.status !== 'active' || record.remainingQuantity === 0}
          onClick={() => {
            setSelectedTicket(record)
            setPurchaseModalVisible(true)
          }}
        >
          购买
        </Button>
      )
    }
  ]

  // 购买记录列定义
  const purchaseColumns = [
    {
      title: '活动名称',
      key: 'ticketTitle',
      render: (record: Purchase) => {
        const ticket = tickets.find(t => t.id === record.ticketId)
        return ticket?.title || '未知活动'
      }
    },
    {
      title: '购买数量',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => `${price} JJC`
    },
    {
      title: '购买时间',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'confirmed' ? 'green' : 'orange'}>
          {status === 'confirmed' ? '已确认' : '待确认'}
        </Tag>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>
            <CarryOutOutlined /> JJTicket 票务系统
          </Title>
          <Text type="secondary">
            基于区块链的去中心化票务平台
          </Text>
        </div>

        {/* 统计信息 */}
        <Row gutter={24}>
          <Col xs={24} sm={6}>
            <Statistic
              title="可购票数"
              value={tickets.filter(t => t.status === 'active').length}
              prefix={<CarryOutOutlined />}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="我的JJC余额"
              value={formattedBalance}
              suffix="JJC"
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              precision={4}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="购买记录"
              value={purchases.length}
              prefix={<ShoppingCartOutlined />}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="总消费"
              value={purchases.reduce((sum, p) => sum + p.totalPrice, 0)}
              suffix="JJC"
              prefix={<TeamOutlined />}
            />
          </Col>
        </Row>

        <Tabs defaultActiveKey="tickets" type="card">
          {/* 票务列表 */}
          <TabPane 
            tab={
              <Space>
                <CarryOutOutlined />
                可购票务
              </Space>
            } 
            key="tickets"
          >
            <Card 
              title="票务列表"
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  录入票务
                </Button>
              }
              style={{ borderRadius: '12px' }}
            >
              <Table
                columns={ticketColumns}
                dataSource={tickets}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            </Card>
          </TabPane>

          {/* 购买记录 */}
          <TabPane 
            tab={
              <Space>
                <ShoppingCartOutlined />
                购买记录
              </Space>
            } 
            key="purchases"
          >
            <Card 
              title="我的购买记录"
              style={{ borderRadius: '12px' }}
            >
              <Table
                columns={purchaseColumns}
                dataSource={purchases}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </TabPane>

          {/* 兑换JJC */}
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
                  title="购票前先兑换JJC"
                  onExchangeSuccess={() => {
                    message.success('兑换成功，现在可以购票了！')
                  }}
                />
              </Col>
              <Col xs={24} lg={12}>
                <Card 
                  title="JJC使用说明"
                  style={{ borderRadius: '12px', height: '100%' }}
                >
                  <Space direction="vertical" size="middle">
                    <Alert
                      message="票务购买流程"
                      description={
                        <ol style={{ margin: 0, paddingLeft: '16px' }}>
                          <li>兑换ETH为JJC代币</li>
                          <li>浏览可购买的票务</li>
                          <li>选择票务并确定数量</li>
                          <li>使用JJC完成购买</li>
                          <li>查看购买记录和票务信息</li>
                        </ol>
                      }
                      type="info"
                      icon={<CheckCircleOutlined />}
                    />

                    <Alert
                      message="票务系统特色"
                      description={
                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                          <li>区块链存储防伪hash</li>
                          <li>JJC代币支付更安全</li>
                          <li>去中心化票务管理</li>
                          <li>透明的购买记录</li>
                        </ul>
                      }
                      type="success"
                    />
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Space>

      {/* 创建票务模态框 */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            录入新票务
          </Space>
        }
        open={createModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setCreateModalVisible(false)}
        confirmLoading={loading}
        okText="创建票务"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTicket}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="活动名称"
                rules={[{ required: true, message: '请输入活动名称' }]}
              >
                <Input placeholder="请输入活动名称" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="description"
                label="活动描述"
                rules={[{ required: true, message: '请输入活动描述' }]}
              >
                <TextArea rows={3} placeholder="请输入活动描述" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="venue"
                label="活动地点"
                rules={[{ required: true, message: '请输入活动地点' }]}
              >
                <Input placeholder="请输入活动地点" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="eventDate"
                label="活动时间"
                rules={[{ required: true, message: '请选择活动时间' }]}
              >
                <DatePicker 
                  showTime 
                  placeholder="选择活动时间" 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="票价(JJC)"
                rules={[{ required: true, message: '请输入票价' }]}
              >
                <InputNumber
                  min={1}
                  placeholder="票价"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="票数"
                rules={[{ required: true, message: '请输入票数' }]}
              >
                <InputNumber
                  min={1}
                  placeholder="票数"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="票务类型"
                rules={[{ required: true, message: '请选择票务类型' }]}
              >
                <Select placeholder="选择类型">
                  <Option value="concert">演唱会</Option>
                  <Option value="sports">体育赛事</Option>
                  <Option value="theater">戏剧演出</Option>
                  <Option value="conference">会议活动</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 购票模态框 */}
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined />
            购买票务
          </Space>
        }
        open={purchaseModalVisible}
        onOk={handlePurchaseTicket}
        onCancel={() => {
          setPurchaseModalVisible(false)
          setSelectedTicket(null)
          setPurchaseQuantity(1)
        }}
        confirmLoading={isPurchaseLoading}
        okText="确认购买"
        cancelText="取消"
      >
        {selectedTicket && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card size="small">
              <Text strong>{selectedTicket.title}</Text>
              <br />
              <Text type="secondary">
                <CalendarOutlined /> {selectedTicket.eventDate}
              </Text>
              <br />
              <Text type="secondary">
                <EnvironmentOutlined /> {selectedTicket.venue}
              </Text>
            </Card>

            <Row gutter={16}>
              <Col span={12}>
                <Text>购买数量：</Text>
                <InputNumber
                  min={1}
                  max={selectedTicket.remainingQuantity}
                  value={purchaseQuantity}
                  onChange={(value) => setPurchaseQuantity(value || 1)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={12}>
                <Text>单价：</Text>
                <Text strong style={{ color: '#1890ff' }}>
                  {selectedTicket.price} JJC
                </Text>
              </Col>
            </Row>

            <Divider />

            <Row justify="space-between">
              <Text>总价：</Text>
              <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                {selectedTicket.price * purchaseQuantity} JJC
              </Text>
            </Row>

            <Row justify="space-between">
              <Text>我的余额：</Text>
              <Text strong style={{ 
                color: formattedBalance >= selectedTicket.price * purchaseQuantity ? '#52c41a' : '#ff4d4f'
              }}>
                {formattedBalance.toFixed(4)} JJC
              </Text>
            </Row>

            {formattedBalance < selectedTicket.price * purchaseQuantity && (
              <Alert
                message="JJC余额不足"
                description="请先兑换足够的JJC代币"
                type="warning"
                showIcon
              />
            )}

            {/* 交易状态提示 */}
            {transferHash && (
              <Alert
                message={
                  transferConfirming 
                    ? "JJC转账确认中，请等待区块链确认..." 
                    : "JJC转账已提交，正在处理..."
                }
                type="info"
                showIcon
              />
            )}
          </Space>
        )}
      </Modal>
    </div>
  )
} 