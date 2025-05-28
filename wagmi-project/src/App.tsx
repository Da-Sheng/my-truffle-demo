import React, { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { ConnectKitButton } from "connectkit"
import { CreateRedPacket } from './components/CreateRedPacket'
import { RedPacketQueue } from './components/RedPacketQueue'
import { RedPacketDetails } from './components/RedPacketDetails'
import { useQueryClient } from '@tanstack/react-query'

// Ant Design imports
import { 
  Layout, 
  Tabs, 
  Card, 
  Avatar, 
  Space, 
  Button, 
  Typography, 
  Row, 
  Col,
  Divider,
  Alert,
  Tag
} from 'antd'
import { 
  GiftOutlined, 
  MoneyCollectOutlined, 
  BarChartOutlined,
  WalletOutlined,
  DisconnectOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import 'antd/dist/reset.css'

const { Header, Content, Footer } = Layout
const { Title, Paragraph, Text } = Typography

// 页面标签枚举
enum PageTab {
  QUEUE = 'queue',
  CREATE = 'create', 
  DETAILS = 'details'
}

function App() {
  const account = useAccount()
  const { disconnect } = useDisconnect()
  const [activeTab, setActiveTab] = useState<PageTab>(PageTab.QUEUE)
  const queryClient = useQueryClient()

  // 监听账户变化
  useEffect(() => {
    if (account.address) {
      console.log('🔄 账户已切换:', account.address)
      
      // 清除所有相关查询缓存，强制重新获取数据
      queryClient.invalidateQueries({ queryKey: ['readContract'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['allowance'] })
      
      // 显示账户切换提示
      console.log('✅ 账户信息已更新，相关数据正在重新加载...')
    }
  }, [account.address, queryClient])

  // 处理创建红包成功
  const handleCreateSuccess = () => {
    // 清除相关查询缓存，强制重新获取数据
    queryClient.invalidateQueries({ queryKey: ['readContract'] })
    
    // 显示成功提示，但不自动跳转
    console.log('红包创建成功！')
  }

  // 标签页配置
  const tabItems = [
    {
      key: PageTab.QUEUE,
      label: (
        <Space>
          <GiftOutlined />
          抢红包
        </Space>
      ),
      children: <RedPacketQueue />
    },
    {
      key: PageTab.CREATE,
      label: (
        <Space>
          <MoneyCollectOutlined />
          发红包
        </Space>
      ),
      children: <CreateRedPacket onSuccess={handleCreateSuccess} />
    },
    {
      key: PageTab.DETAILS,
      label: (
        <Space>
          <BarChartOutlined />
          红包详情
        </Space>
      ),
      children: <RedPacketDetails />
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header style={{ 
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Logo和标题 */}
        <Space size="large">
          <div style={{ fontSize: '32px' }}>🧧</div>
          <Title level={3} style={{ margin: 0, color: 'white' }}>
            Web3红包系统
          </Title>
        </Space>

        {/* 账户信息和连接按钮 */}
        <Space size="large">
          {account.status === 'connected' && account.address && (
            <Card 
              size="small" 
              style={{ 
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '12px',
                border: 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <Space direction="vertical" size={0}>
                <Space size={4}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: '#52c41a',
                    animation: 'pulse 2s infinite'
                  }} />
                  <Text strong style={{ fontSize: '12px' }}>
                    <WalletOutlined /> {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </Text>
                </Space>
                <Space size={4}>
                  <Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>
                    链ID: {account.chainId}
                  </Tag>
                  <Tag color="green" style={{ fontSize: '10px', margin: 0 }}>
                    已连接
                  </Tag>
                </Space>
              </Space>
            </Card>
          )}
          
          {account.status === 'connecting' && (
            <Card 
              size="small" 
              style={{ 
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '12px',
                border: 'none'
              }}
            >
              <Space>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#fa8c16',
                  animation: 'pulse 1s infinite'
                }} />
                <Text style={{ fontSize: '12px' }}>连接中...</Text>
              </Space>
            </Card>
          )}
          
          <ConnectKitButton />
          
          {account.status === 'connected' && (
            <Button
              type="primary"
              danger
              icon={<DisconnectOutlined />}
              onClick={() => disconnect()}
              style={{ borderRadius: '8px' }}
            >
              断开连接
            </Button>
          )}
        </Space>
      </Header>

      {/* 主要内容区域 */}
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {account.status === 'connected' ? (
            <Card 
              style={{ 
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: 'none'
              }}
            >
              <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as PageTab)}
                items={tabItems}
                size="large"
                style={{ minHeight: '500px' }}
                tabBarStyle={{ 
                  marginBottom: '24px',
                  borderBottom: '2px solid #f0f0f0'
                }}
              />
            </Card>
          ) : (
            /* 未连接钱包的欢迎页面 */
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: '120px', marginBottom: '32px' }}>🧧</div>
              
              <Title level={1} style={{ marginBottom: '16px', color: '#333' }}>
                欢迎来到Web3红包
              </Title>
              
              <Paragraph 
                style={{ 
                  fontSize: '18px', 
                  color: '#666', 
                  marginBottom: '48px',
                  maxWidth: '600px',
                  margin: '0 auto 48px auto'
                }}
              >
                基于区块链技术的去中心化红包系统，体验全新的数字红包乐趣！
                支持随机分配和平均分配两种模式，让每一次红包都充满惊喜。
              </Paragraph>
              
              {/* 功能特色 */}
              <Row gutter={[24, 24]} style={{ maxWidth: '900px', margin: '0 auto 48px auto' }}>
                <Col xs={24} md={8}>
                  <Card 
                    hoverable
                    style={{ 
                      textAlign: 'center',
                      borderRadius: '16px',
                      height: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎲</div>
                    <Title level={4}>随机分配</Title>
                    <Paragraph>
                      随机金额分配，每个红包金额不同，增加趣味性和惊喜感
                    </Paragraph>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card 
                    hoverable
                    style={{ 
                      textAlign: 'center',
                      borderRadius: '16px',
                      height: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</div>
                    <Title level={4}>平均分配</Title>
                    <Paragraph>
                      金额平均分配，确保每个参与者都能获得相同的收益
                    </Paragraph>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card 
                    hoverable
                    style={{ 
                      textAlign: 'center',
                      borderRadius: '16px',
                      height: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
                    <Title level={4}>区块链保障</Title>
                    <Paragraph>
                      去中心化智能合约保障，资金安全透明，无法篡改
                    </Paragraph>
                  </Card>
                </Col>
              </Row>

              <ConnectKitButton />
            </div>
          )}
        </div>
      </Content>

      {/* 使用说明 */}
      {account.status === 'connected' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 24px 24px' }}>
          <Alert
            message="使用说明"
            description={
              <Row gutter={[24, 16]}>
                <Col xs={24} md={8}>
                  <Space direction="vertical" size={4}>
                    <Text strong><GiftOutlined /> 抢红包</Text>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      <li>查看当前可领取的红包</li>
                      <li>点击红包即可领取</li>
                      <li>每人只能领取一次</li>
                      <li>队列机制确保公平性</li>
                    </ul>
                  </Space>
                </Col>
                <Col xs={24} md={8}>
                  <Space direction="vertical" size={4}>
                    <Text strong><MoneyCollectOutlined /> 发红包</Text>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      <li>设置红包总金额和数量</li>
                      <li>选择平分或随机分配</li>
                      <li>确认交易后自动创建</li>
                      <li>创建成功后进入队列</li>
                    </ul>
                  </Space>
                </Col>
                <Col xs={24} md={8}>
                  <Space direction="vertical" size={4}>
                    <Text strong><BarChartOutlined /> 红包详情</Text>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      <li>查看红包领取进度</li>
                      <li>查看个人领取状态</li>
                      <li>查看领取历史记录</li>
                      <li>查看红包基本信息</li>
                    </ul>
                  </Space>
                </Col>
              </Row>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            style={{ 
              borderRadius: '12px',
              border: '1px solid #d9d9d9'
            }}
          />
        </div>
      )}

      {/* 页脚 */}
      <Footer style={{ textAlign: 'center', background: '#fafafa' }}>
        <Text type="secondary">
          Web3红包系统 © 2024 基于区块链技术驱动
        </Text>
      </Footer>
    </Layout>
  )
}

export default App
