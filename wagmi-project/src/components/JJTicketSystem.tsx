import React, { useState, useEffect, useMemo } from 'react'
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
  Select,
  Tabs,
  DatePicker,
  Switch,
  Popover
} from 'antd'
import { 
  ShoppingCartOutlined,
  DollarOutlined,
  PlusOutlined,
  CarryOutOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  UserOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  ReloadOutlined,
  SyncOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useJJCBalance, formatJJCAmount } from '../hooks/useJJCoin'
import { 
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
import { formatEther, parseEther, hexToString } from 'viem'
import { useReadContract } from 'wagmi'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

// 增强的票务详情Modal组件
const TicketDetailModal: React.FC<{
  visible: boolean
  hash: string
  onClose: () => void
}> = ({ visible, hash, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [ticketDetail, setTicketDetail] = useState<any>(null)

  // 获取票价信息
  const { data: ticketPrice } = useReadContract({
    ...jjTicketConfig,
    functionName: 'ticketPrice',
  })
  const formattedTicketPrice = ticketPrice ? parseFloat(formatTicketAmount(ticketPrice as bigint)) : 0

  // 票务详情Modal内部的辅助函数
  const formatApiDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm')
  }

  const formatApiPrice = (price: number) => {
    return (price / 100).toFixed(2) // 从分转换为元
  }

  // 获取票务详情
  const fetchTicketDetail = async (uni256: string) => {
    if (!uni256) return
    
    try {
      setLoading(true)
      
      // 第一步：查询合约以获取真实的hashValue
      const contractResponse = await fetch('/api/sepolia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: jjTicketConfig.address, // 使用配置中的合约地址
            data: `0x22e68703${uni256.slice(2).padStart(64, '0')}`
          }, 'latest'],
          id: 1
        })
      })
      
      const ethResult = await contractResponse.json()
      let hashValueToQuery = null // 用于查询数据库的hash值
      let buyerHex = '0x0000000000000000000000000000000000000000'
      let exists = false
      
      if (!ethResult.error) {
        // 解析合约返回结果
        const resultData = ethResult.result
        if (resultData && resultData !== '0x' && resultData.length >= 320) {
          // 解析hashValue和exists状态
          const hashValueHex = '0x' + resultData.slice(2, 66) // 前64位是hashValue
          buyerHex = '0x' + resultData.slice(66, 106) // 接下来40位是buyer地址
          const existsHex = resultData.slice(-64) // 最后64位是exists布尔值
          exists = parseInt(existsHex, 16) === 1
          
          if (exists) {
            // 🔧 修复：正确解析合约返回的hashValue
            // 现在合约中存储的是原始字符串的bytes32编码，需要解码回字符串
            hashValueToQuery = hexToString(hashValueHex as `0x${string}`).replace(/\0+$/, '').toLowerCase()
          }
        }
      }
      
      // 🔧 修复：如果合约查询失败或不存在，直接尝试使用传入的hash作为uni256查询数据库
      if (!hashValueToQuery) {
        hashValueToQuery = uni256.toLowerCase()
      }
      
      // 第二步：使用确定的hashValue作为uni256查询数据库
      const graphqlResponse = await fetch('http://localhost:8787/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetTicketDetail($uni256: String!) {
              ticket(uni256: $uni256) {
                id
                uni256
                title
                description
                venue
                startTime
                endTime
                price
                organizer
                totalQuantity
                soldQuantity
                category
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            uni256: hashValueToQuery
          }
        })
      })
      
      const result = await graphqlResponse.json()
      
      if (result.errors) {
        setTicketDetail({
          uni256: uni256,
          title: `票务 ${uni256.slice(0, 8)}`,
          description: '未找到详细信息，可能是仅在区块链上的Hash',
          venue: '区块链',
          startTime: new Date().toISOString(),
          price: 0,
          organizer: '系统',
          totalQuantity: 1,
          soldQuantity: 0,
          category: 'blockchain',
          isBlockchainOnly: true,
          _realHashValue: hashValueToQuery,
          _blockchainHash: uni256,
          _buyer: buyerHex
        })
      } else {
        setTicketDetail({
          ...result.data?.ticket,
          _realHashValue: hashValueToQuery,
          _blockchainHash: uni256,
          _buyer: buyerHex
        })
      }
      
    } catch (error) {
      console.error('详情Modal：获取票务详情失败:', error)
      // 设置默认信息
      setTicketDetail({
        uni256: uni256,
        title: `区块链票务 ${uni256.slice(0, 8)}`,
        description: '这是一个仅存在于区块链上的Hash，没有存储详细信息',
        venue: '区块链网络',
        startTime: new Date().toISOString(),
        price: 0,
        organizer: '区块链系统',
        totalQuantity: 1,
        soldQuantity: 0,
        category: 'blockchain',
        isBlockchainOnly: true
      })
    } finally {
      setLoading(false)
    }
  }

  // 当Modal打开时获取详情
  useEffect(() => {
    if (visible && hash) {
      fetchTicketDetail(hash)
    }
  }, [visible, hash])

  if (!ticketDetail && !loading) {
    return null
  }

  return (
    <Modal
      title={<><EyeOutlined /> 票务详情</>}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={700}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text>正在加载票务详情...</Text>
        </div>
      ) : (
        <div>
          {ticketDetail?.isBlockchainOnly && (
            <Alert
              message="区块链票务"
              description="此票务仅存在于区块链上，没有存储详细信息"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card size="small" title="基本信息">
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>活动标题：</Text>
                    <br />
                    <Text style={{ fontSize: '16px' }}>{ticketDetail?.title || '未设置'}</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>主办方：</Text>
                    <br />
                    <Text>{ticketDetail?.organizer || '未设置'}</Text>
                  </Col>
                </Row>
                
                <div style={{ marginTop: 12 }}>
                  <Text strong>活动描述：</Text>
                  <br />
                  <Text type="secondary">
                    {ticketDetail?.description || '暂无描述'}
                  </Text>
                </div>
              </Card>
            </Col>

            <Col span={12}>
              <Card size="small" title="时间地点">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    <Text strong>开始时间：</Text>
                    <br />
                    <Text>{ticketDetail?.startTime ? formatApiDate(ticketDetail.startTime) : '待定'}</Text>
                  </div>
                  
                  {ticketDetail?.endTime && (
                    <div>
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      <Text strong>结束时间：</Text>
                      <br />
                      <Text>{formatApiDate(ticketDetail.endTime)}</Text>
                    </div>
                  )}
                  
                  <div>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    <Text strong>活动地点：</Text>
                    <br />
                    <Text>{ticketDetail?.venue || '待定'}</Text>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col span={12}>
              <Card size="small" title="票务信息">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <DollarOutlined style={{ marginRight: 8 }} />
                    <Text strong>票价：</Text>
                    <br />
                    <Text style={{ fontSize: '16px', color: '#1890ff' }}>
                      {ticketDetail?.price ? formatApiPrice(ticketDetail.price) : formattedTicketPrice} {ticketDetail?.price ? '元' : 'JJC'}
                    </Text>
                  </div>
                  
                  <div>
                    <UserOutlined style={{ marginRight: 8 }} />
                    <Text strong>票务数量：</Text>
                    <br />
                    <Text>总量: {ticketDetail?.totalQuantity || 1} | 已售: {ticketDetail?.soldQuantity || 0}</Text>
                  </div>
                  
                  <div>
                    <Tag color={ticketDetail?.category === 'vip' ? 'gold' : ticketDetail?.category === 'early' ? 'green' : 'blue'}>
                      {ticketDetail?.category === 'vip' ? 'VIP票' : 
                       ticketDetail?.category === 'early' ? '早鸟票' : 
                       ticketDetail?.category === 'student' ? '学生票' : '普通票'}
                    </Tag>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col span={24}>
              <Card size="small" title="区块链信息">
                <div>
                  <Text strong>Hash标识：</Text>
                  <br />
                  <Text code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                    {hash}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(hash)
                      message.success('Hash已复制到剪贴板')
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    复制
                  </Button>
                </div>
                
                {ticketDetail?.createdAt && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>创建时间：</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {formatApiDate(ticketDetail.createdAt)}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  )
}

export const JJTicketSystem: React.FC = () => {
  // 钱包信息
  const { address } = useAccount()
  
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [hashForm] = Form.useForm()

  // 新增：票务API相关状态
  const [apiTicketModalVisible, setApiTicketModalVisible] = useState(false)
  const [ticketDetailModalVisible, setTicketDetailModalVisible] = useState(false)
  const [selectedTicketUni256, setSelectedTicketUni256] = useState<string>('')
  const [apiTicketForm] = Form.useForm()

  // 新增：存储从数据库获取的票务详情
  const [ticketDetails, setTicketDetails] = useState<{[key: string]: any}>({})
  // 新增：存储数据库中的所有票务列表
  const [allDatabaseTickets, setAllDatabaseTickets] = useState<any[]>([])

  // 合约数据查询
  const { data: ticketPrice } = useReadContract({
    ...jjTicketConfig,
    functionName: 'ticketPrice',
  })
  const { data: totalTickets } = useReadContract({
    ...jjTicketConfig,
    functionName: 'totalTickets',
  })
  const { data: soldTickets } = useReadContract({
    ...jjTicketConfig,
    functionName: 'soldTickets',
  })
  const { data: owner } = useReadContract({
    ...jjTicketConfig,
    functionName: 'owner',
  })
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

  // 新增：存储待创建的票务数据
  const [pendingTicketData, setPendingTicketData] = useState<any>(null)

  // 🔧 新增：获取数据库中的所有票务列表
  const fetchAllDatabaseTickets = async () => {
    try {
      console.log('🎯 步骤1：请求数据库 - 开始获取数据库中的所有票务列表')
      
      const response = await fetch('http://localhost:8787/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetAllTickets {
              tickets {
                id
                uni256
                title
                description
                venue
                startTime
                endTime
                price
                organizer
                totalQuantity
                soldQuantity
                category
                createdAt
                updatedAt
              }
            }
          `
        })
      })
      
      const result = await response.json()
      
      if (!result.errors && result.data?.tickets) {
        console.log(`🎯 步骤1：请求数据库 - 成功获取${result.data.tickets.length}个数据库票务`)
        setAllDatabaseTickets(result.data.tickets)
        return result.data.tickets
      } else {
        console.log('🎯 步骤1：请求数据库 - 数据库查询失败或无数据')
        setAllDatabaseTickets([])
        return []
      }
      
    } catch (error) {
      console.error('🎯 步骤1：请求数据库 - 获取数据库票务列表失败:', error)
      setAllDatabaseTickets([])
      return []
    }
  }

  // 🔧 新增：提取的票务数据处理函数
  const processTicketData = async () => {
    if (Array.isArray(allHashes) && allHashes.length > 0) {
      console.log(`🎯 步骤2：拿到链上allhash - 共${allHashes.length}个hash`)
      
      // 先获取数据库列表
      const dbTickets = await fetchAllDatabaseTickets()
      
      if (dbTickets.length > 0) {
        console.log(`🎯 步骤3：过滤交集 - 开始根据链上hash过滤数据库结果`)
        
        // 创建数据库票务的uni256映射
        const dbTicketsMap = dbTickets.reduce((map: {[key: string]: any}, ticket: any) => {
          map[ticket.uni256.toLowerCase()] = ticket
          return map
        }, {})
        
        // 过滤：只保留同时存在于链上和数据库的票务
        const intersectionTickets: {[key: string]: any} = {}
        let foundCount = 0
        
        for (const blockchainHash of allHashes) {
          // 首先尝试直接匹配
          const directMatch = dbTicketsMap[blockchainHash.toLowerCase()]
          if (directMatch) {
            intersectionTickets[blockchainHash] = directMatch
            foundCount++
            console.log(`🎯 步骤3：过滤交集 - 直接匹配成功: ${blockchainHash}`)
            continue
          }
          
          // 如果直接匹配失败，尝试解析链上hash为原始字符串再匹配
          try {
            const contractResponse = await fetch('/api/sepolia', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                  to: jjTicketConfig.address,
                  data: `0x22e68703${blockchainHash.slice(2).padStart(64, '0')}`
                }, 'latest'],
                id: 1
              })
            })
            
            const ethResult = await contractResponse.json()
            if (!ethResult.error) {
              const resultData = ethResult.result
              if (resultData && resultData !== '0x' && resultData.length >= 320) {
                const hashValueHex = '0x' + resultData.slice(2, 66)
                const existsHex = resultData.slice(-64)
                const exists = parseInt(existsHex, 16) === 1
                
                if (exists) {
                  const decodedString = hexToString(hashValueHex as `0x${string}`).replace(/\0+$/, '')
                  const isValidString = /^[A-Za-z0-9\-_.\s]*$/.test(decodedString)
                  
                  if (isValidString && decodedString.length > 0) {
                    const originalHash = decodedString.toLowerCase()
                    const dbMatch = dbTicketsMap[originalHash]
                    
                    if (dbMatch) {
                      intersectionTickets[blockchainHash] = dbMatch
                      foundCount++
                      console.log(`🎯 步骤3：过滤交集 - 解析匹配成功: ${blockchainHash} -> ${originalHash}`)
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.log(`🎯 步骤3：过滤交集 - 解析${blockchainHash}失败:`, error)
          }
        }
        
        console.log(`🎯 步骤3：过滤交集 - 完成过滤，找到${foundCount}个同时存在于链上和数据库的票务`)
        setTicketDetails(intersectionTickets)
      }
    } else {
      console.log('🎯 步骤2：拿到链上allhash - 链上无hash数据')
      setTicketDetails({})
    }
  }

  // 🔧 修改：当allHashes变化时的处理逻辑
  useEffect(() => {
    processTicketData()
  }, [allHashes])

  // 修改后的票务数据 - 只展示同时存在于链上和数据库的票务
  const availableTickets = useMemo(() => {
    if (!Array.isArray(allHashes)) return []
    
    // 只处理在ticketDetails中有数据的hash（即同时存在于链上和数据库的）
    return allHashes.filter(hash => ticketDetails[hash]).map((hash: string) => {
      const dbDetail = ticketDetails[hash]
      
      return {
        uni256: hash,
        title: dbDetail.title,
        description: dbDetail.description,
        venue: dbDetail.venue,
        startTime: dbDetail.startTime,
        endTime: dbDetail.endTime,
        price: dbDetail.price, // 数据库中的价格（分）
        organizer: dbDetail.organizer,
        totalQuantity: dbDetail.totalQuantity,
        soldQuantity: Array.isArray(buyerHashes) && buyerHashes.includes(hash) ? 1 : 0,
        category: dbDetail.category,
        available: !Array.isArray(buyerHashes) || !buyerHashes.includes(hash),
        hasDbDetail: true // 既然能进入这里，说明一定有数据库详情
      }
    })
  }, [allHashes, buyerHashes, ticketDetails])

  // 辅助函数定义
  const handleViewApiTicketDetail = (uni256: string) => {
    setSelectedTicketUni256(uni256)
    setTicketDetailModalVisible(true)
  }

  const formatApiDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm')
  }

  const formatApiPrice = (price: number) => {
    return (price / 100).toFixed(2) // 从分转换为元
  }

  // 生成随机Hash
  const generateRandomHash = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const randomHash = `TICKET-${timestamp}-${random.toUpperCase()}`
    
    apiTicketForm.setFieldsValue({ customHash: randomHash })
    message.success('已生成随机Hash')
  }

  // 处理Hash票务购买
  const handlePurchaseHash = async (hash: string) => {
    try {
      // 使用现有的随机购票功能购买指定Hash
      await handlePurchaseRandomTicket()
      message.success('票务购买成功')
    } catch (error) {
      console.error('购买失败:', error)
      message.error('购买失败，请重试')
    }
  }

  // 监听购票成功
  useEffect(() => {
    if (randomPurchaseConfirmed || specificPurchaseConfirmed) {
      message.success('购票成功！')
      refetchHashes()
      refetchBuyerHashes()
      refetchBalance()
      refetchAllowance()
      setLoading(false)
    }
  }, [randomPurchaseConfirmed, specificPurchaseConfirmed, refetchHashes, refetchBuyerHashes, refetchBalance, refetchAllowance])

  // 监听添加hash成功
  useEffect(() => {
    if (addHashesConfirmed) {
      message.success('区块链Hash添加成功！')
      refetchHashes()
      
      // 如果有待处理的票务数据，现在同步到数据库
      if (pendingTicketData) {
        handleDatabaseSync(pendingTicketData)
        setPendingTicketData(null)
      }
      
      setLoading(false)
    }
  }, [addHashesConfirmed, refetchHashes, pendingTicketData])

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
    if (!specificPurchaseHash) {
      message.error('请选择要购买的票务Hash')
      return
    }

    if (formattedBalance < formattedTicketPrice) {
      message.error('JJC余额不足！')
      return
    }
    
    if (!hasEnoughAllowance) {
      message.warning('需要先授权JJC代币转账权限')
      await handleApproveJJC()
      return
    }
    
    // 检查用户是否已将JJC添加到MetaMask
    try {
      if (typeof window.ethereum !== 'undefined') {
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
      }
    } catch (error) {
      console.warn('添加JJC代币失败，但继续购票流程:', error)
    }
    
    try {
      setLoading(true)
      purchaseTicket(specificPurchaseHash)
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
      
      addTicketHashes(hashArray)
    } catch (error) {
      console.error('添加Hash失败:', error)
      message.error('添加Hash失败，请重试')
      setLoading(false)
    }
  }

  // 当区块链hash添加确认后，调用数据库接口
  const handleDatabaseSync = async (ticketData: any) => {
    try {
      console.log('🎯 步骤2：保存流程 - 区块链确认成功，开始同步到数据库:', ticketData)
      
      // 🔧 修复：直接使用用户生成的hash作为uni256，不需要从区块链查询
      const finalTicketData = {
        ...ticketData,
        uni256: ticketData.uni256 // 直接使用用户生成的hash作为uni256
      }
      
      console.log('🎯 步骤2：保存流程 - 最终同步到数据库的数据:', finalTicketData)
      
      const response = await fetch('http://localhost:8787/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation CreateTicket($input: TicketInput!) {
              createTicket(input: $input) {
                id
                uni256
                title
                price
              }
            }
          `,
          variables: {
            input: finalTicketData
          }
        })
      })
      
      const result = await response.json()
      
      if (result.errors) {
        console.error('🎯 步骤2：保存流程 - 数据库同步失败:', result.errors)
        message.warning(`票务Hash已在区块链创建，但数据库同步失败: ${result.errors[0].message}`)
        return
      }
      
      console.log('🎯 步骤2：保存流程 - 数据库同步成功:', result.data)
      message.success(`票务创建完成！Hash: ${finalTicketData.uni256}`)
      
      // 清理表单和状态
      apiTicketForm.resetFields()
      setApiTicketModalVisible(false)
      
      // 重新获取票务详情以更新显示
      if (Array.isArray(allHashes) && allHashes.length > 0) {
        processTicketData()
      }
      
    } catch (error) {
      console.error('🎯 步骤2：保存流程 - 数据库同步失败:', error)
      const errorMessage = error instanceof Error ? error.message : '网络错误'
      message.warning(`票务Hash已在区块链创建，但数据库同步失败: ${errorMessage}`)
    }
  }

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
  }

  // 统一的票务表格列配置
  const unifiedTicketColumns = [
    {
      title: 'Hash标识',
      dataIndex: 'uni256',
      key: 'hash',
      width: 200,
      render: (hash: string, record: any) => (
        <div>
          <Popover
            content={
              <div style={{ maxWidth: 300 }}>
                <Text style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                  {hash}
                </Text>
                <br />
                <Button
                  type="link"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(hash)
                    message.success('Hash已复制到剪贴板')
                  }}
                  style={{ padding: 0, marginTop: 4 }}
                >
                  复制Hash
                </Button>
              </div>
            }
            title="完整Hash"
          >
            <Text code style={{ cursor: 'pointer' }}>
              {hash.slice(0, 10)}...{hash.slice(-8)}
            </Text>
          </Popover>
          <Tag color={record.hasDbDetail ? "green" : "blue"} style={{ marginLeft: 4, fontSize: '10px' }}>
            {record.hasDbDetail ? "数据库" : "区块链"}
          </Tag>
        </div>
      ),
    },
    {
      title: '活动信息',
      key: 'info',
      render: (record: any) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.venue} | {record.organizer}
          </Text>
          {!record.hasDbDetail && (
            <div>
              <Tag color="orange" style={{ fontSize: '10px', marginTop: 2 }}>
                仅区块链数据
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '票价',
      key: 'price',
      render: (record: any) => {
        if (record.hasDbDetail && record.price) {
          // 数据库价格（分转换为元）
          return `¥${(record.price / 100).toFixed(2)}`
        } else {
          // 区块链价格
          return `${formattedTicketPrice} JJC`
        }
      },
    },
    {
      title: '时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string, record: any) => {
        if (!time) return <Text type="secondary">待设置</Text>
        
        if (record.hasDbDetail) {
          return formatApiDate(time)
        } else {
          return <Text type="secondary">区块链票务</Text>
        }
      },
    },
    {
      title: '可购买',
      key: 'available',
      render: (record: any) => record.available ? '可购买' : '已售出',
    },
    {
      title: '操作',
      key: 'action',
      render: (record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<ShoppingCartOutlined />}
            onClick={() => handlePurchaseHash(record.uni256)}
            loading={randomPurchasePending || randomPurchaseConfirming}
            disabled={
              !record.available || 
              formattedBalance < formattedTicketPrice || 
              !hasEnoughAllowance
            }
          >
            购买
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewApiTicketDetail(record.uni256)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ]

  // 完善的票务创建函数 - 区块链到数据库单向同步
  const handleCreateUnifiedTicket = async (values: any) => {
    try {
      setLoading(true)
      
      // 🔧 修复：hash现在是必填字段，直接使用用户输入的hash
      const ticketHash = values.customHash?.trim()
      
      if (!ticketHash) {
        message.error('请输入票务Hash')
        setLoading(false)
        return
      }
      
      // 准备票务数据
      const ticketData = {
        uni256: ticketHash,
        title: values.title,
        description: values.description || '',
        venue: values.venue,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime?.toISOString() || values.startTime.toISOString(),
        price: Math.round(values.price * 100), // 转换为分
        organizer: values.organizer,
        totalQuantity: values.totalQuantity || 1,
        category: values.category || 'general'
      }
      
      console.log('🎯 步骤1：新建票务 - 准备创建票务数据:', ticketData)
      
      // 存储待处理的票务数据，等待区块链确认
      setPendingTicketData(ticketData)
      
      // 1. 只添加到区块链，等待确认
      addTicketHashes([ticketHash])
      
      console.log('🎯 步骤1：新建票务 - 开始调用合约addTicketHashes，hash:', ticketHash)
      message.info(`正在区块链上创建票务Hash: ${ticketHash}，请等待确认...`)
      
    } catch (error) {
      console.error('创建票务失败:', error)
      const errorMessage = error instanceof Error ? error.message : '请重试'
      message.error(`创建票务失败: ${errorMessage}`)
      setLoading(false)
      setPendingTicketData(null)
    }
  }

  // 🔧 修复：改为单个获取票务详情的函数，按照用户要求的流程
  const fetchSingleTicketDetail = async (blockchainHash: string) => {
    try {
      console.log(`🎯 步骤3：查询列表 - 开始处理单个hash: ${blockchainHash}`)
      
      // 第一步：查询合约以获取真实的hashValue
      const contractResponse = await fetch('/api/sepolia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: jjTicketConfig.address,
            data: `0x22e68703${blockchainHash.slice(2).padStart(64, '0')}`
          }, 'latest'],
          id: 1
        })
      });
      
      const ethResult = await contractResponse.json()
      let hashValueToQuery = null
      let buyerHex = '0x0000000000000000000000000000000000000000'
      let exists = false
      
      if (!ethResult.error) {
        const resultData = ethResult.result
        if (resultData && resultData !== '0x' && resultData.length >= 320) {
          const hashValueHex = '0x' + resultData.slice(2, 66)
          buyerHex = '0x' + resultData.slice(66, 106)
          const existsHex = resultData.slice(-64)
          exists = parseInt(existsHex, 16) === 1
          
          if (exists) {
            try {
              // 🔧 修复：直接尝试解码hex为字符串
              console.log(`🎯 步骤3：查询列表 - 准备解码hashValueHex: ${hashValueHex}`)
              const decodedString = hexToString(hashValueHex as `0x${string}`).replace(/\0+$/, '')
              console.log(`🎯 步骤3：查询列表 - 原始解码结果: "${decodedString}"`)
              console.log(`🎯 步骤3：查询列表 - 解码结果长度: ${decodedString.length}`)
              console.log(`🎯 步骤3：查询列表 - 解码结果字符码: [${Array.from(decodedString).map(c => c.charCodeAt(0)).join(', ')}]`)
              
              // 🔧 修复：更宽松的验证逻辑，允许常见的ASCII字符和数字
              const isValidString = /^[A-Za-z0-9\-_.\s]*$/.test(decodedString)
              console.log(`🎯 步骤3：查询列表 - 字符串验证结果: ${isValidString}`)
              
              if (isValidString && decodedString.length > 0) {
                hashValueToQuery = decodedString.toLowerCase()
                console.log(`🎯 步骤3：查询列表 - 成功解析为原始字符串: ${hashValueToQuery}`)
              } else {
                console.log(`🎯 步骤3：查询列表 - 解析结果不是有效字符串，使用区块链hash: ${blockchainHash}`)
                console.log(`🎯 步骤3：查询列表 - 解析结果详情: "${decodedString}" (长度: ${decodedString.length})`)
                hashValueToQuery = blockchainHash.toLowerCase()
              }
            } catch (error) {
              console.log(`🎯 步骤3：查询列表 - hexToString解析失败，使用区块链hash: ${blockchainHash}`)
              console.log(`🎯 步骤3：查询列表 - 错误详情:`, error)
              hashValueToQuery = blockchainHash.toLowerCase()
            }
          }
        }
      }
      
      // 如果合约查询失败或不存在，直接使用区块链hash作为uni256查询数据库
      if (!hashValueToQuery) {
        hashValueToQuery = blockchainHash.toLowerCase()
      }
      
      console.log(`🎯 步骤3：查询列表 - 确定用于查询数据库的uni256: ${hashValueToQuery}`)
      
      // 第二步：单个调用接口从数据库拿数据（按照用户要求的流程）
      const graphqlResponse = await fetch('http://localhost:8787/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetTicketDetail($uni256: String!) {
              ticket(uni256: $uni256) {
                id
                uni256
                title
                description
                venue
                startTime
                endTime
                price
                organizer
                totalQuantity
                soldQuantity
                category
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            uni256: hashValueToQuery
          }
        })
      })
      
      const graphqlResult = await graphqlResponse.json()
      
      if (!graphqlResult.errors && graphqlResult.data?.ticket) {
        console.log(`🎯 步骤3：查询列表 - 数据库查询成功，hash: ${blockchainHash}`)
        return {
          [blockchainHash]: {
            ...graphqlResult.data.ticket,
            _realHashValue: hashValueToQuery,
            _blockchainHash: blockchainHash,
            _buyer: buyerHex,
            _fromContract: exists
          }
        }
      } else {
        console.log(`🎯 步骤3：查询列表 - 数据库中未找到，uni256: ${hashValueToQuery}`)
        return {}
      }
      
    } catch (error) {
      console.error(`获取票务 ${blockchainHash} 详情失败:`, error)
      return {}
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <CarryOutOutlined /> JJ票务系统
      </Title>
      
      {/* 权限状态提示 */}
      {address && (
        <Alert
          message={isOwner ? "🎯 管理员权限" : "👤 普通用户"}
          description={
            isOwner 
              ? `您是合约owner，拥有创建票务的权限。Owner地址: ${owner}`
              : `您是普通用户，只能购买票务。当前地址: ${address}`
          }
          type={isOwner ? "success" : "info"}
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}
      
      {/* 系统统计 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="区块链票价"
              value={formattedTicketPrice}
              suffix="JJC"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="区块链总票数"
              value={totalTickets ? Number(totalTickets) : 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已创建Hash"
              value={Array.isArray(allHashes) ? allHashes.length : 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="可购买票务"
              value={availableTickets.filter(ticket => ticket.available).length}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 我的JJC余额 */}
      <Card style={{ marginBottom: '24px' }}>
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
              </Space>
            </Space>
          </Col>
        </Row>
        
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

      {/* 票务管理 */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Text strong style={{ fontSize: '16px' }}>票务管理系统</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              基于区块链的简化票务系统
            </Text>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => refetchHashes()}
            >
              刷新数据
            </Button>
            {isOwner && (
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setApiTicketModalVisible(true)}
              >
                创建票务（完整信息）
              </Button>
            )}
          </Space>
        </div>

        <Table
          columns={unifiedTicketColumns}
          dataSource={availableTickets}
          pagination={{ pageSize: 10 }}
          size="small"
          loading={false}
          title={() => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>票务列表 ({availableTickets.length})</Text>
            </div>
          )}
        />
      </Card>

      {/* 我的购买记录 */}
      {Array.isArray(buyerHashes) && buyerHashes.length > 0 && (
        <Card title={<><ShoppingCartOutlined /> 我的购票记录 ({buyerHashes.length})</>} style={{ marginTop: '24px' }}>
          <Row gutter={[16, 16]}>
            {buyerHashes.map((hash: string, index: number) => (
              <Col key={index} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  size="small"
                  hoverable
                  style={{ 
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleViewApiTicketDetail(hash)}
                  bodyStyle={{ padding: '12px' }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <Tag color="green" style={{ marginBottom: 8 }}>
                      已购买
                    </Tag>
                    <div>
                      <Text code style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
                        {hash.slice(0, 12)}...{hash.slice(-8)}
                      </Text>
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        style={{ padding: 0, height: 'auto', fontSize: '12px' }}
                      >
                        查看详情
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          
          <Alert
            message="💡 票务使用说明"
            description="点击任意票务卡片可查看详细信息。这些是您已购买的票务Hash，请保存好作为入场凭证。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      )}

      {/* 创建票务Modal */}
      <Modal
        title="创建完整票务信息"
        open={apiTicketModalVisible}
        onOk={() => apiTicketForm.submit()}
        onCancel={() => {
          setApiTicketModalVisible(false)
          apiTicketForm.resetFields()
          setLoading(false)
        }}
        confirmLoading={loading}
        okText="创建票务"
        cancelText="取消"
        width={800}
      >
        <Alert
          message="🎯 创建完整票务"
          description="创建票务将同时在区块链上添加Hash引用，并在数据库中保存详细信息"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={apiTicketForm}
          layout="vertical"
          onFinish={handleCreateUnifiedTicket}
          initialValues={{
            totalQuantity: 1,
            category: 'general',
            price: formattedTicketPrice
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="活动标题"
                rules={[{ required: true, message: '请输入活动标题' }]}
              >
                <Input placeholder="例：音乐会门票" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="organizer"
                label="主办方"
                rules={[{ required: true, message: '请输入主办方' }]}
              >
                <Input placeholder="例：某某文化公司" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="活动描述"
          >
            <TextArea 
              rows={3} 
              placeholder="活动详细描述信息..." 
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="venue"
                label="活动地点"
                rules={[{ required: true, message: '请输入活动地点' }]}
              >
                <Input placeholder="例：某某体育馆" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="票务类型"
              >
                <Select>
                  <Option value="general">普通票</Option>
                  <Option value="vip">VIP票</Option>
                  <Option value="early">早鸟票</Option>
                  <Option value="student">学生票</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder="选择开始时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="结束时间"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder="选择结束时间（可选）"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="customHash"
            label="票务Hash"
            rules={[{ required: true, message: '请输入票务Hash' }]}
            tooltip="必填：请输入唯一的票务Hash标识"
          >
            <Input 
              placeholder="请输入票务Hash（必填）"
              showCount
              maxLength={66}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="票价（JJC）"
                rules={[{ required: true, message: '请输入票价' }]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: '100%' }}
                  placeholder="票价"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="totalQuantity"
                label="发行数量"
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="票务数量"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Hash生成工具" style={{ marginBottom: 0 }}>
                <Button 
                  type="dashed" 
                  icon={<ThunderboltOutlined />}
                  onClick={generateRandomHash}
                  style={{ width: '100%' }}
                >
                  生成随机Hash
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 票务详情Modal */}
      <TicketDetailModal
        visible={ticketDetailModalVisible}
        hash={selectedTicketUni256}
        onClose={() => {
          setTicketDetailModalVisible(false)
          setSelectedTicketUni256('')
        }}
      />
    </div>
  )
} 