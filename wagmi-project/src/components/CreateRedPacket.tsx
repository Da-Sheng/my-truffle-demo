// 创建红包组件
import React, { useState } from 'react'
import { useCreateBag } from '../hooks/useHappyBag'
import { useAccount } from 'wagmi'
import {
  Card,
  Form,
  InputNumber,
  Radio,
  Button,
  Space,
  Alert,
  Descriptions,
  Typography,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  GiftOutlined,
  MoneyCollectOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  WalletOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface CreateRedPacketProps {
  onSuccess?: () => void
}

export const CreateRedPacket: React.FC<CreateRedPacketProps> = ({ onSuccess }) => {
  const { address, isConnected } = useAccount()
  const { createBag, isPending, isConfirming, isConfirmed, error } = useCreateBag()
  
  const [form] = Form.useForm()
  const [amount, setAmount] = useState<number>(0)
  const [count, setCount] = useState<number>(1)
  const [isEqual, setIsEqual] = useState<boolean>(false)
  const [showForm, setShowForm] = useState(false)

  // 表单验证
  const isFormValid = () => {
    return amount > 0 && count > 0 && count <= 100
  }

  // 处理创建红包
  const handleCreate = () => {
    if (!isFormValid() || !isConnected) return
    
    createBag(amount.toString(), count, isEqual)
  }

  // 重置表单
  const resetForm = () => {
    form.resetFields()
    setAmount(0)
    setCount(1)
    setIsEqual(false)
    setShowForm(false)
  }

  // 监听交易确认
  React.useEffect(() => {
    if (isConfirmed) {
      resetForm()
      // 短暂延迟后调用成功回调，让用户看到成功提示
      setTimeout(() => {
        onSuccess?.()
      }, 2000) // 2秒后执行跳转
    }
  }, [isConfirmed, onSuccess])

  if (!isConnected) {
    return (
      <Card style={{ textAlign: 'center' }}>
        <Space direction="vertical" size="large">
          <WalletOutlined style={{ fontSize: '48px', color: '#bfbfbf' }} />
          <Title level={4} type="secondary">请先连接钱包以创建红包</Title>
        </Space>
      </Card>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <MoneyCollectOutlined />
            创建红包
          </Space>
        }
        extra={
          !showForm && (
            <Button
              type="primary"
              size="large"
              icon={<GiftOutlined />}
              onClick={() => setShowForm(true)}
              style={{ borderRadius: '8px' }}
            >
              创建新红包
            </Button>
          )
        }
        style={{ borderRadius: '12px' }}
      >
        {/* 成功状态显示 */}
        {isConfirmed && (
          <Alert
            message="红包创建成功! 🎉"
            description="红包已成功创建，正在跳转到详情页面..."
            type="success"
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: '24px', borderRadius: '8px' }}
            showIcon
          />
        )}

        {/* 加载状态显示 */}
        {(isPending || isConfirming) && (
          <Alert
            message="创建中..."
            description="请在钱包中确认交易，交易正在处理中"
            type="info"
            icon={<LoadingOutlined />}
            style={{ marginBottom: '24px', borderRadius: '8px' }}
            showIcon
          />
        )}

        {showForm && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
            style={{ marginTop: '16px' }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                {/* 金额输入 */}
                <Form.Item
                  label="红包总金额 (ETH)"
                  name="amount"
                  rules={[
                    { required: true, message: '请输入红包金额' },
                    { type: 'number', min: 0.0001, message: '金额必须大于0.0001 ETH' }
                  ]}
                >
                  <InputNumber
                    placeholder="请输入金额"
                    min={0.0001}
                    step={0.0001}
                    precision={4}
                    style={{ width: '100%' }}
                    size="large"
                    onChange={(value) => setAmount(value || 0)}
                    addonAfter="ETH"
                  />
                </Form.Item>

                {/* 红包数量 */}
                <Form.Item
                  label="红包数量"
                  name="count"
                  help="最多可创建100个红包"
                  rules={[
                    { required: true, message: '请输入红包数量' },
                    { type: 'number', min: 1, max: 100, message: '红包数量应在1-100之间' }
                  ]}
                >
                  <InputNumber
                    placeholder="请输入红包数量"
                    min={1}
                    max={100}
                    style={{ width: '100%' }}
                    size="large"
                    onChange={(value) => setCount(value || 1)}
                    addonAfter="个"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                {/* 分配方式 */}
                <Form.Item
                  label="分配方式"
                  name="isEqual"
                  rules={[{ required: true, message: '请选择分配方式' }]}
                >
                  <Radio.Group
                    onChange={(e) => setIsEqual(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Card
                        size="small"
                        style={{
                          border: !isEqual ? '2px solid #ff4d4f' : '1px solid #d9d9d9',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setIsEqual(false)}
                      >
                        <Radio value={false}>
                          <Space direction="vertical" size={0}>
                            <Text strong>🎲 随机红包</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              金额随机分配，更有趣味性
                            </Text>
                          </Space>
                        </Radio>
                      </Card>
                      
                      <Card
                        size="small"
                        style={{
                          border: isEqual ? '2px solid #ff4d4f' : '1px solid #d9d9d9',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setIsEqual(true)}
                      >
                        <Radio value={true}>
                          <Space direction="vertical" size={0}>
                            <Text strong>⚖️ 平分红包</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              金额平均分配，公平公正
                            </Text>
                          </Space>
                        </Radio>
                      </Card>
                    </Space>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            {/* 红包预览 */}
            {amount > 0 && count > 0 && (
              <>
                <Divider>红包预览</Divider>
                <Card style={{ background: '#fafafa', borderRadius: '8px' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="总金额"
                        value={amount}
                        precision={4}
                        suffix="ETH"
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="红包数量"
                        value={count}
                        suffix="个"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="分配方式"
                        value={isEqual ? '平分' : '随机'}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    {isEqual && (
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="单个红包"
                          value={amount / count}
                          precision={4}
                          suffix="ETH"
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Col>
                    )}
                  </Row>
                </Card>
              </>
            )}

            {/* 错误信息 */}
            {error && (
              <Alert
                message="创建失败"
                description={error.message}
                type="error"
                style={{ marginTop: '16px', borderRadius: '8px' }}
                showIcon
              />
            )}

            {/* 按钮组 */}
            <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
              <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
                <Button
                  size="large"
                  onClick={resetForm}
                  disabled={isPending || isConfirming}
                  style={{ minWidth: '120px', borderRadius: '8px' }}
                >
                  取消
                </Button>
                
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={isPending || isConfirming}
                  disabled={!isFormValid()}
                  icon={<GiftOutlined />}
                  style={{ minWidth: '120px', borderRadius: '8px' }}
                >
                  {isPending ? '确认中...' : isConfirming ? '处理中...' : '创建红包'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {/* 默认状态显示 */}
        {!showForm && !isConfirmed && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💰</div>
            <Title level={4} type="secondary">开始创建您的红包</Title>
            <Text type="secondary">
              支持随机分配和平均分配两种模式，让每一次红包都充满惊喜
            </Text>
          </div>
        )}
      </Card>
    </div>
  )
} 