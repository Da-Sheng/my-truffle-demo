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
  Alert,
  Form,
  Statistic,
  InputNumber,
  Select
} from 'antd'
import { 
  ShoppingCartOutlined,
  DollarOutlined,
  PlusOutlined,
  CarryOutOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useJJCBalance, formatJJCAmount } from '../hooks/useJJCoin'
import { 
  useTicketInfo, 
  useAllHashes, 
  useBuyerHashes, 
  usePurchaseRandomTicket,
  usePurchaseSpecificTicket,
  useAddTicketHashes,
  useJJCAllowance,
  useApproveJJC,
  formatJJCAmount as formatTicketAmount
} from '../hooks/useJJTicket'
import { useAccount } from 'wagmi'
import { jjTicketConfig } from '../contracts/jjTicket'
import { jjCoinConfig } from '../contracts/jjCoin'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

export const JJTicketSystem: React.FC = () => {
  // 钱包信息
  const { address } = useAccount()
  
  // 状态管理
  const [createHashModalVisible, setCreateHashModalVisible] = useState(false)
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false)
  const [selectedHash, setSelectedHash] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hashForm] = Form.useForm()

  // 合约数据查询
  const { ticketPrice, totalTickets, soldTickets, owner, availableTickets } = useTicketInfo()
  const { data: allHashes, refetch: refetchHashes } = useAllHashes()
  const { data: buyerHashes, refetch: refetchBuyerHashes } = useBuyerHashes(address)
  
  // JJC余额查询
  const { data: jjcBalance, refetch: refetchBalance } = useJJCBalance(address)
  
  // JJC授权查询
  const { data: allowance, refetch: refetchAllowance } = useJJCAllowance(address, jjTicketConfig.address)
  
  // 合约操作hooks
  const {
    purchaseRandomTicket,
    isPending: randomPurchasePending,
    isConfirming: randomPurchaseConfirming,
    isConfirmed: randomPurchaseConfirmed,
    error: randomPurchaseError
  } = usePurchaseRandomTicket()

  const {
    purchaseTicket,
    hash: specificPurchaseHash,
    isPending: specificPurchasePending,
    isConfirming: specificPurchaseConfirming,
    isConfirmed: specificPurchaseConfirmed,
    error: specificPurchaseError
  } = usePurchaseSpecificTicket()

  const {
    addTicketHashes,
    isPending: addHashesPending,
    isConfirming: addHashesConfirming,
    isConfirmed: addHashesConfirmed,
    error: addHashesError
  } = useAddTicketHashes()
  
  // JJC授权操作
  const {
    approveJJC,
    isPending: approvePending,
    isConfirming: approveConfirming,
    isConfirmed: approveConfirmed,
    error: approveError
  } = useApproveJJC()
  
  // 计算格式化的余额和价格
  const formattedBalance = jjcBalance ? parseFloat(formatJJCAmount(jjcBalance as bigint)) : 0
  const formattedTicketPrice = ticketPrice ? parseFloat(formatTicketAmount(ticketPrice as bigint)) : 0
  const isOwner = Boolean(address && owner && typeof owner === 'string' && address.toLowerCase() === owner.toLowerCase())
  
  // 检查授权是否足够
  const hasEnoughAllowance = allowance && ticketPrice ? (allowance as bigint) >= (ticketPrice as bigint) : false
  const formattedAllowance = allowance ? parseFloat(formatJJCAmount(allowance as bigint)) : 0

  // 新增状态：生成配置
  const [generateCount, setGenerateCount] = useState(10)
  const [generatePrefix, setGeneratePrefix] = useState('TICKET')
  const [generateType, setGenerateType] = useState<'sequential' | 'random'>('sequential')

  // 监听购票成功
  useEffect(() => {
    if (randomPurchaseConfirmed || specificPurchaseConfirmed) {
      message.success('购票成功！')
      refetchHashes()
      refetchBuyerHashes()
      refetchBalance()
      refetchAllowance()
      setPurchaseModalVisible(false)
      setSelectedHash(null)
      setLoading(false)
    }
  }, [randomPurchaseConfirmed, specificPurchaseConfirmed, refetchHashes, refetchBuyerHashes, refetchBalance, refetchAllowance])

  // 监听添加hash成功
  useEffect(() => {
    if (addHashesConfirmed) {
      message.success('票务Hash添加成功！')
      refetchHashes()
      setCreateHashModalVisible(false)
      hashForm.resetFields()
    }
  }, [addHashesConfirmed, refetchHashes, hashForm])

  // 监听授权成功
  useEffect(() => {
    if (approveConfirmed) {
      message.success('JJC授权成功！')
      refetchAllowance()
      setLoading(false)
    }
  }, [approveConfirmed, refetchAllowance])

  // 监听错误
  useEffect(() => {
    const error = randomPurchaseError || specificPurchaseError || addHashesError || approveError
    if (error) {
      console.error('操作失败:', error)
      message.error(`操作失败: ${error.message || '未知错误'}`)
      setLoading(false)
    }
  }, [randomPurchaseError, specificPurchaseError, addHashesError, approveError])

  // 处理JJC授权
  const handleApproveJJC = async () => {
    if (!ticketPrice) {
      message.error('无法获取票价信息')
      return
    }
    
    try {
      setLoading(true)
      // 授权一个较大的额度，避免每次购票都需要授权
      const approveAmount = (ticketPrice as bigint) * BigInt(100) // 授权100张票的额度
      approveJJC(jjTicketConfig.address, approveAmount)
    } catch (error) {
      console.error('授权失败:', error)
      message.error('授权失败，请重试')
      setLoading(false)
    }
  }

  // 处理随机购票
  const handlePurchaseRandomTicket = async () => {
    if (formattedBalance < formattedTicketPrice) {
      message.error('JJC余额不足！')
      return
    }
    
    if (!hasEnoughAllowance) {
      message.warning('需要先授权JJC代币转账权限')
      await handleApproveJJC()
      return
    }
    
    try {
      setLoading(true)
      purchaseRandomTicket()
    } catch (error) {
      console.error('购票失败:', error)
      message.error('购票失败，请重试')
      setLoading(false)
    }
  }

  // 处理指定hash购票
  const handlePurchaseSpecificTicket = async () => {
    console.log('=== 开始购票流程 ===')
    console.log('选中的Hash:', selectedHash)
    console.log('JJC余额:', formattedBalance, 'JJC')
    console.log('票价:', formattedTicketPrice, 'JJC')
    console.log('授权额度:', formattedAllowance, 'JJC')
    console.log('授权状态:', hasEnoughAllowance ? '足够' : '不足')
    console.log('JJC合约地址:', jjCoinConfig.address)
    console.log('票务合约地址:', jjTicketConfig.address)
    console.log('钱包地址:', address)
    
    if (!selectedHash) {
      message.error('请选择要购买的票务Hash')
      return
    }

    if (formattedBalance < formattedTicketPrice) {
      console.log('❌ JJC余额不足')
      message.error('JJC余额不足！')
      return
    }
    
    if (!hasEnoughAllowance) {
      console.log('❌ 授权额度不足，开始授权流程')
      message.warning('需要先授权JJC代币转账权限')
      await handleApproveJJC()
      return
    }
    
    // 检查用户是否已将JJC添加到MetaMask
    try {
      if (typeof window.ethereum !== 'undefined') {
        console.log('🔍 检查JJC代币是否已添加到MetaMask')
        // 尝试添加JJC代币到MetaMask，如果已存在会跳过
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: jjCoinConfig.address,
              symbol: 'JJC',
              decimals: 18,
            },
          },
        })
        console.log('✅ JJC代币已确保添加到MetaMask')
      }
    } catch (error) {
      console.warn('添加JJC代币失败，但继续购票流程:', error)
    }
    
    try {
      console.log('✅ 所有检查通过，开始执行购票')
      console.log('即将调用合约函数: purchaseTicket')
      console.log('合约地址:', jjTicketConfig.address)
      console.log('函数参数:', selectedHash)
      setLoading(true)
      purchaseTicket(selectedHash)
    } catch (error) {
      console.error('购票失败:', error)
      message.error('购票失败，请重试')
      setLoading(false)
    }
  }

  // 处理添加票务hash
  const handleAddTicketHashes = async (values: any) => {
    try {
      setLoading(true)
      const hashArray = values.hashes
        .split('\n')
        .map((h: string) => h.trim())
        .filter((h: string) => h.length > 0)
        
      if (hashArray.length === 0) {
        message.error('请输入至少一个有效的票务Hash')
        setLoading(false)
        return
      }
      
      // 验证每个hash格式
      const invalidHashes = hashArray.filter((h: string) => {
        // 如果是0x开头的hex格式，检查长度
        if (h.startsWith('0x')) {
          return h.length !== 66
        }
        // 其他格式的字符串长度应该合理（不能太短或太长）
        return h.length < 3 || h.length > 100
      })
      
      if (invalidHashes.length > 0) {
        message.error(`以下Hash格式无效: ${invalidHashes.slice(0, 3).join(', ')}${invalidHashes.length > 3 ? '...' : ''}`)
        setLoading(false)
        return
      }
      
      console.log('准备添加的Hash:', hashArray)
      addTicketHashes(hashArray)
    } catch (error) {
      console.error('添加Hash失败:', error)
      message.error('添加Hash失败，请重试')
      setLoading(false)
    }
  }

  // 生成票务Hash
  const generateTicketHashes = () => {
    const hashes: string[] = []
    const timestamp = Date.now()
    
    for (let i = 0; i < generateCount; i++) {
      if (generateType === 'sequential') {
        // 顺序生成：前缀-时间戳-序号
        hashes.push(`${generatePrefix}-${timestamp}-${String(i + 1).padStart(3, '0')}`)
      } else {
        // 随机生成：前缀-时间戳-随机数
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
        hashes.push(`${generatePrefix}-${timestamp}-${randomPart}`)
      }
    }
    
    // 将生成的hash填入表单
    const hashText = hashes.join('\n')
    hashForm.setFieldsValue({ hashes: hashText })
    
    message.success(`已生成 ${generateCount} 个票务Hash`)
  }

  // 复制生成的hash到剪贴板
  const copyToClipboard = () => {
    const hashValue = hashForm.getFieldValue('hashes')
    if (hashValue) {
      navigator.clipboard.writeText(hashValue).then(() => {
        message.success('已复制到剪贴板')
      }).catch(() => {
        message.error('复制失败')
      })
    } else {
      message.warning('没有内容可复制')
    }
  }

  // 票务Hash列表列定义
  const hashColumns = [
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {hash.slice(0, 10)}...{hash.slice(-8)}
        </Text>
      )
    },
    {
      title: '状态',
      key: 'status',
      render: (record: any) => (
        <Tag color={Array.isArray(buyerHashes) && buyerHashes.includes(record.hash) ? 'green' : 'blue'}>
          {Array.isArray(buyerHashes) && buyerHashes.includes(record.hash) ? '已购买' : '可购买'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (record: any) => (
        <Button
          type="primary"
          size="small"
          disabled={Array.isArray(buyerHashes) && buyerHashes.includes(record.hash)}
          onClick={() => {
            setSelectedHash(record.hash)
            setPurchaseModalVisible(true)
          }}
        >
          {Array.isArray(buyerHashes) && buyerHashes.includes(record.hash) ? '已购买' : '购买'}
        </Button>
      )
    }
  ]

  const hashDataSource = Array.isArray(allHashes) ? allHashes.map((hash: string, index: number) => ({
    key: index,
    hash
  })) : []

  // 添加代币到MetaMask的函数
  const addTokenToMetaMask = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: jjCoinConfig.address,
              symbol: 'JJC',
              decimals: 18,
              image: '', // 可以添加代币图标URL
            },
          },
        });

        if (wasAdded) {
          message.success('JJC代币已添加到MetaMask!');
        } else {
          message.info('用户取消了添加操作');
        }
      } else {
        message.error('未检测到MetaMask');
      }
    } catch (error) {
      console.error('添加代币失败:', error);
      message.error('添加代币失败');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <CarryOutOutlined /> JJ票务系统
      </Title>
      
      {/* 系统统计 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="票价"
              value={formattedTicketPrice}
              suffix="JJC"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总票数"
              value={totalTickets ? Number(totalTickets) : 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已售票数"
              value={soldTickets ? Number(soldTickets) : 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="剩余票数"
              value={availableTickets ? Number(availableTickets) : 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 我的JJC余额 */}
      <Card style={{ marginBottom: '24px' }}>
        {/* 调试信息 */}
        <Alert
          message="💡 余额显示差异说明"
          description={
            <div style={{ fontSize: '12px' }}>
              <div><strong>合约查询余额：</strong>{formattedBalance.toFixed(4)} JJC (来自区块链合约)</div>
              <div><strong>钱包显示余额：</strong>可能不同，原因如下：</div>
              <ul style={{ marginLeft: 16, marginTop: 4 }}>
                <li>MetaMask需要手动添加代币：合约地址 {jjCoinConfig.address}</li>
                <li>网络连接：确保MetaMask连接到 localhost:8545</li>
                <li>缓存问题：可尝试刷新MetaMask代币列表</li>
              </ul>
              <div style={{ marginTop: 8 }}>
                <strong>技术信息：</strong>
                <div>JJC合约地址: {jjCoinConfig.address}</div>
                <div>JJTicket合约地址: {jjTicketConfig.address}</div>
                <div>钱包地址: {address || '未连接'}</div>
                <div>原始余额: {jjcBalance ? String(jjcBalance) : 'undefined'} wei</div>
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Row gutter={16} align="middle">
          <Col>
            <DollarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          </Col>
          <Col flex="auto">
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <div>
                  <Text type="secondary">我的JJC余额</Text>
                  <br />
                  <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                    {formattedBalance.toFixed(4)} JJC
                  </Text>
                  {/* 调试信息 */}
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    原始值: {jjcBalance ? String(jjcBalance) : 'undefined'}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    地址: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '未连接'}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">已授权额度</Text>
                  <br />
                  <Text strong style={{ 
                    fontSize: '16px', 
                    color: hasEnoughAllowance ? '#52c41a' : '#ff4d4f' 
                  }}>
                    {formattedAllowance.toFixed(4)} JJC
                  </Text>
                  <br />
                  <Button 
                    type="link" 
                    size="small"
                    onClick={addTokenToMetaMask}
                    style={{ padding: 0, height: 'auto', fontSize: '12px' }}
                  >
                    📱 添加JJC到MetaMask
                  </Button>
                </div>
              </Col>
            </Row>
          </Col>
          <Col>
            <Space direction="vertical" size="small">
              {!hasEnoughAllowance && (
                <Button 
                  type="default"
                  loading={approvePending || approveConfirming}
                  onClick={handleApproveJJC}
                  style={{ width: '120px' }}
                >
                  授权JJC
                </Button>
              )}
              <Space>
                <Button 
                  type="primary" 
                  icon={<ShoppingCartOutlined />}
                  onClick={handlePurchaseRandomTicket}
                  loading={randomPurchasePending || randomPurchaseConfirming}
                  disabled={formattedBalance < formattedTicketPrice}
                >
                  随机购票
                </Button>
                {isOwner && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setCreateHashModalVisible(true)}
                  >
                    录入票务
                  </Button>
                )}
              </Space>
            </Space>
          </Col>
        </Row>
        
        {/* 授权状态提示 */}
        {!hasEnoughAllowance && (
          <Alert
            message="需要授权JJC代币"
            description="购票前需要授权票务系统转账您的JJC代币。点击上方'授权JJC'按钮完成授权。"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* 票务Hash列表 */}
      <Card title="可购票务Hash">
        <Table
          columns={hashColumns}
          dataSource={hashDataSource}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* 我的购买记录 */}
      {Array.isArray(buyerHashes) && buyerHashes.length > 0 && (
        <Card title="我的购票记录" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {buyerHashes.map((hash: string, index: number) => (
              <Tag key={index} color="green">
                <Text code style={{ fontSize: '12px' }}>
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                </Text>
              </Tag>
            ))}
          </div>
        </Card>
      )}

      {/* 创建票务Modal */}
      <Modal
        title="录入票务Hash"
        open={createHashModalVisible}
        onOk={() => hashForm.submit()}
        onCancel={() => {
          setCreateHashModalVisible(false)
          hashForm.resetFields()
          setLoading(false)
        }}
        confirmLoading={loading || addHashesPending || addHashesConfirming}
        okText="添加Hash"
        cancelText="取消"
        width={800}
      >
        <Form
          form={hashForm}
          layout="vertical"
          onFinish={handleAddTicketHashes}
        >
          {/* 自动生成工具 */}
          <Card 
            title={
              <Space>
                <ThunderboltOutlined />
                <span>快速生成工具</span>
              </Space>
            }
            size="small" 
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div>
                  <Text strong>生成数量</Text>
                  <InputNumber
                    min={1}
                    max={100}
                    value={generateCount}
                    onChange={(val) => setGenerateCount(val || 10)}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text strong>票务前缀</Text>
                  <Input
                    value={generatePrefix}
                    onChange={(e) => setGeneratePrefix(e.target.value)}
                    placeholder="如：TICKET、VIP、EVENT"
                    style={{ marginTop: 4 }}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text strong>生成类型</Text>
                  <Select
                    value={generateType}
                    onChange={setGenerateType}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    <Option value="sequential">顺序编号</Option>
                    <Option value="random">随机编号</Option>
                  </Select>
                </div>
              </Col>
            </Row>
            <Row style={{ marginTop: 16 }}>
              <Col span={24}>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<ThunderboltOutlined />}
                    onClick={generateTicketHashes}
                  >
                    生成Hash
                  </Button>
                  <Button 
                    icon={<CopyOutlined />}
                    onClick={copyToClipboard}
                  >
                    复制
                  </Button>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    示例：{generatePrefix}-{Date.now()}-001
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>

          <Alert
            message="票务Hash录入说明"
            description={
              <div>
                <p>支持多种Hash格式：</p>
                <ul style={{ marginBottom: 8 }}>
                  <li><strong>标准格式：</strong>0x开头的64位十六进制字符串</li>
                  <li><strong>文本格式：</strong>任意文本字符串（如：abc123、ticket-001）</li>
                  <li><strong>快速生成：</strong>使用上方工具快速生成规范的票务Hash</li>
                </ul>
                <p>每行一个Hash，系统会自动去除空行和空格，并将所有格式转换为标准的bytes32格式。</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            name="hashes"
            label="票务Hash列表"
            rules={[
              { required: true, message: '请输入票务Hash' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve()
                  const hashArray = value.split('\n').map((h: string) => h.trim()).filter((h: string) => h.length > 0)
                  if (hashArray.length === 0) {
                    return Promise.reject(new Error('请输入至少一个有效的Hash'))
                  }
                  if (hashArray.length > 100) {
                    return Promise.reject(new Error('一次最多只能添加100个Hash'))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <TextArea 
              rows={10} 
              placeholder={`请输入票务Hash，每行一个，或使用上方工具快速生成。

支持格式示例：
abc123
ticket-001
VIP-seat-A1
event-20241201-001
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

任何文本都会被自动转换为标准的32字节哈希格式。`}
              showCount
              maxLength={10000}
            />
          </Form.Item>
          
          {addHashesError && (
            <Alert
              message="录入失败"
              description={addHashesError.message || '未知错误，请重试'}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {addHashesConfirming && (
            <Alert
              message="正在处理"
              description="票务Hash正在添加到区块链，请稍候..."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </Form>
      </Modal>

      {/* 购票确认Modal */}
      <Modal
        title="购票确认"
        open={purchaseModalVisible}
        onOk={handlePurchaseSpecificTicket}
        onCancel={() => {
          setPurchaseModalVisible(false)
          setSelectedHash(null)
          setLoading(false)
        }}
        confirmLoading={specificPurchasePending || specificPurchaseConfirming || loading}
        okText={
          formattedBalance < formattedTicketPrice 
            ? "余额不足" 
            : !hasEnoughAllowance 
              ? "请先授权"
              : "确认购买"
        }
        okButtonProps={{
          disabled: formattedBalance < formattedTicketPrice || !hasEnoughAllowance
        }}
        cancelText="取消"
      >
        {selectedHash && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card size="small">
              <Text strong>票务Hash:</Text>
              <br />
              <Text code>{selectedHash}</Text>
            </Card>

            <Row gutter={16}>
              <Col span={12}>
                <Text>票价：</Text>
                <Text strong style={{ color: '#1890ff' }}>
                  {formattedTicketPrice} JJC
                </Text>
              </Col>
              <Col span={12}>
                <Text>我的余额：</Text>
                <Text strong style={{ 
                  color: formattedBalance >= formattedTicketPrice ? '#52c41a' : '#ff4d4f'
                }}>
                  {formattedBalance.toFixed(4)} JJC
                </Text>
              </Col>
            </Row>

            {/* 交易调试信息 */}
            <Alert
              message="🔍 交易调试信息"
              description={
                <div style={{ fontSize: '12px' }}>
                  <div><strong>交易类型：</strong>ERC20 代币转账 (JJC)</div>
                  <div><strong>JJC合约：</strong>{jjCoinConfig.address}</div>
                  <div><strong>票务合约：</strong>{jjTicketConfig.address}</div>
                  <div><strong>授权额度：</strong>{formattedAllowance.toFixed(4)} JJC</div>
                  <div><strong>需要额度：</strong>{formattedTicketPrice} JJC</div>
                  <div><strong>授权状态：</strong>{hasEnoughAllowance ? '✅ 足够' : '❌ 不足'}</div>
                  <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                    <strong>📋 购票流程：</strong>
                    <ol style={{ marginLeft: 16, marginBottom: 0 }}>
                      <li>验证JJC余额 ≥ 票价</li>
                      <li>验证JJC授权额度 ≥ 票价</li>
                      <li>调用票务合约的 purchaseTicket 函数</li>
                      <li>合约执行 jjCoin.transferFrom() 转移JJC</li>
                      <li>MetaMask应显示JJC代币转账</li>
                    </ol>
                  </div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {formattedBalance < formattedTicketPrice && (
              <Alert
                message="JJC余额不足"
                description="请先兑换足够的JJC代币"
                type="warning"
                showIcon
              />
            )}

            {/* JJC授权状态检查 */}
            {!hasEnoughAllowance && formattedBalance >= formattedTicketPrice && (
              <Alert
                message="需要JJC授权"
                description={
                  <div>
                    <div>当前授权额度：{formattedAllowance.toFixed(4)} JJC</div>
                    <div>需要授权额度：{formattedTicketPrice} JJC</div>
                    <div style={{ marginTop: 8 }}>
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={handleApproveJJC}
                        loading={approvePending || approveConfirming}
                      >
                        {approvePending || approveConfirming ? '授权中...' : '立即授权JJC'}
                      </Button>
                    </div>
                  </div>
                }
                type="warning"
                showIcon
              />
            )}

            {/* 授权成功提示 */}
            {hasEnoughAllowance && formattedBalance >= formattedTicketPrice && (
              <Alert
                message="✅ 授权状态正常"
                description={`已授权 ${formattedAllowance.toFixed(4)} JJC，可以购买票务`}
                type="success"
                showIcon
              />
            )}

            {/* 交易状态提示 */}
            {specificPurchaseHash && (
              <Alert
                message={
                  specificPurchaseConfirming 
                    ? "购票确认中，请等待区块链确认..." 
                    : "购票已提交，正在处理..."
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