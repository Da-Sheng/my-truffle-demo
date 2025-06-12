import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'

import Head from 'next/head';
import { useStoreData } from '../hooks/useDataToChain'
import styles from '../styles/Home.module.css';
import { useState, useEffect } from 'react';
import {
  type BaseError,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import {
  Input,
  Button,
  Card,
  Space,
  Typography,
  Form,
  message,
  Row,
  Col,
  List,
  Tag,
  Tooltip,
  Modal,
  Descriptions,
  Empty,
  Divider,
  Badge,
  Spin,
  Tabs
} from 'antd';
import {
  SendOutlined,
  DatabaseOutlined,
  WalletOutlined,
  SwapOutlined,
  CopyOutlined,
  HistoryOutlined,
  DeleteOutlined,
  FullscreenOutlined,
  LinkOutlined,
  CloseOutlined,
  EyeOutlined,
  CloudOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  stringToHex,
  safeHexToString,
  isValidHex
} from '../utils/dataCrypto.js';
import storage from '../utils/storage.js';
import { parseEther, parseGwei } from 'viem';
import { DATATOCHAIN_ABI, DATATOCHAIN_ADDRESS } from '../contracts/dataToChain';

const { Title, Text } = Typography;
const { TextArea } = Input;
const query = gql`{
  remarkMsgs(first: 5) {
    id
    sender
    timestamp
    data
  }
}`
const url = 'https://api.studio.thegraph.com/query/113694/graph-search-data-chain/version/latest'
const headers = { Authorization: 'Bearer {api-key}' }

interface HistoryRecord {
  id: number;
  input: string;
  output: string;
  operation: string;
  timestamp: string;
  content?: string;
  address?: string;
  fullContent?: string;
}

// The Graph 查询的消息记录接口
interface ChainMessage {
  id: string;
  sender: string;
  timestamp: string;
  data: string;
  blockNumber?: string;
  transactionHash?: string;
}

// The Graph 查询返回的数据类型
interface GraphQLResponse {
  remarkMsgs: ChainMessage[];
}

const Home: NextPage = () => {
  const { isConnected, address } = useAccount();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('chain');

  // 使用官方示例的查询方式
  const {
    data,
    status,
    refetch,
    isLoading,
    isFetching,
    isRefetching,
    isPending: isPendingQuery
  } = useQuery({
    queryKey: ['data'],
    async queryFn() {
      return await request(url, query, {}, headers)
    }
  });

  console.log('isPending', isPendingQuery)
  console.log('isLoading', isLoading)
  console.log('isFetching', isFetching)
  console.log('isRefetching', isRefetching)
  // 类型安全的数据访问
  const chainData = data as GraphQLResponse | undefined;

  // 使用 wagmi hooks 调用合约
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  // 监听交易确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // 交易成功后的处理
  useEffect(() => {
    if (isConfirmed) {
      message.success('数据已成功存储到区块链日志！');
      // 延迟刷新链上数据，给 The Graph 索引时间
      setTimeout(() => {
        // 重新获取数据的逻辑可以在这里添加
      }, 5000);
    }
  }, [isConfirmed]);

  // 交易错误处理
  useEffect(() => {
    if (error) {
      message.error(`调用合约失败: ${error.message}`);
    }
  }, [error]);

  useEffect(() => {
    const savedHistory = storage.get('log_history') || [];
    setHistory(savedHistory);
  }, []);

  // 处理查询错误
  useEffect(() => {
    if (status === 'error') {
      console.error('查询链上数据失败');
      message.error('查询链上数据失败');
    }
  }, [status]);

  const [form] = Form.useForm();

  const storeData = (data: `0x${string}`) => {
    try {
      // 直接调用合约的 StoreData 方法
      writeContract({
        address: DATATOCHAIN_ADDRESS as `0x${string}`,
        abi: DATATOCHAIN_ABI,
        functionName: 'StoreData',
        args: [data],
      });
    } catch (err) {
      console.error('调用合约失败:', err);
      message.error('调用合约失败');
    }
  };

  const jumpToView = (hash: `0x${string}`) => {
    window.open(`https://sepolia.etherscan.io/tx/${hash}`);
  }

  // 提交处理函数
  const handleSubmit = async (values: { content: string }) => {
    if (!isConnected) {
      message.error('请先连接钱包');
      return;
    }

    try {
      console.log('提交内容:', values.content);
      message.loading('正在提交数据...', 0);
      const formatData = stringToHex(values.content);
      storeData(`0x${formatData}`)

    } catch (error) {
      message.destroy();
      message.error('提交失败，请重试');
      console.error('提交错误:', error);
    } finally {
    }
  };


  // 复制内容到剪贴板
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${type}已复制到剪贴板`);
    });
  };

  // 清空历史记录
  const clearAllHistory = () => {
    Modal.confirm({
      title: '确认清空历史记录',
      content: '此操作不可撤销，确定要清空所有历史记录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setHistory([]);
        storage.remove('log_history');
        message.success('历史记录已清空');
        setIsHistoryModalVisible(false);
      },
    });
  };

  // 删除单条记录
  const deleteRecord = (id: number) => {
    const updatedHistory = history.filter((item: HistoryRecord) => item.id !== id);
    setHistory(updatedHistory);
    storage.set('log_history', updatedHistory);
    message.success('记录已删除');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>数据上链平台</title>
        <meta content="基于区块链的数据存储平台" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <main className={styles.main}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⛓️</div>
          <Title level={1} style={{ marginBottom: '8px' }}>
            数据上链平台
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            将您的重要数据安全地存储在区块链上
          </Text>
        </div>

        {/* 钱包连接 */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <ConnectButton />
        </div>

        {/* 账户信息 */}
        {isConnected && address && (
          <Card
            size="small"
            style={{
              marginBottom: '24px',
              textAlign: 'center',
              background: '#f6ffed',
              border: '1px solid #b7eb8f'
            }}
          >
            <Row gutter={16} align="middle" justify="center">
              <Col>
                <Space>
                  <WalletOutlined style={{ color: '#52c41a' }} />
                  <Text strong>已连接钱包：</Text>
                  <Text code>{address.slice(0, 6)}...{address.slice(-4)}</Text>
                </Space>
              </Col>
              <Col>
                <Divider type="vertical" />
                <Space>
                  <CloudOutlined style={{ color: '#1890ff' }} />
                  <Text strong>链上记录：</Text>
                  <Badge
                    count={chainData?.remarkMsgs?.length || 0}
                    showZero
                    color={(chainData?.remarkMsgs?.length || 0) > 0 ? '#52c41a' : '#d9d9d9'}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        {/* 历史记录按钮 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Space>
            <Button
              type="default"
              size="large"
              icon={<HistoryOutlined />}
              onClick={() => setIsHistoryModalVisible(true)}
              style={{
                borderRadius: '20px',
                padding: '0 24px',
                height: '40px'
              }}
            >
              <Badge count={history.length} showZero color="#52c41a">
                <span style={{ marginRight: '8px' }}>查看历史记录</span>
              </Badge>
            </Button>

            {isConnected && (
              <Button
                type="primary"
                size="large"
                icon={<CloudOutlined />}
                onClick={() => {
                  refetch()
                }}
                loading={isFetching}
                style={{
                  borderRadius: '20px',
                  padding: '0 24px',
                  height: '40px'
                }}
              >
                查询链上记录
              </Button>
            )}
          </Space>
        </div>

        {/* 主要内容区域 */}
        <Row gutter={[24, 24]} style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          {/* 左侧：数据提交 */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <DatabaseOutlined style={{ color: '#1890ff' }} />
                  <span>数据上链提交</span>
                </Space>
              }
              style={{ borderRadius: '12px' }}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                disabled={!isConnected}
              >
                <Form.Item
                  name="content"
                  label="数据内容"
                  rules={[
                    { required: true, message: '请输入内容' },
                    { min: 5, message: '至少需要5个字符' }
                  ]}
                >
                  <TextArea
                    placeholder="请输入要上链的数据..."
                    rows={4}
                    showCount
                    maxLength={500}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!isConnected}
                    loading={isPending || isConfirming}
                    block
                    size="large"
                    icon={<SendOutlined />}
                  >
                    {isPending ? '发送中...' : isConfirming ? '确认中...' : '存储到区块链日志'}
                  </Button>
                </Form.Item>
              </Form>

              {/* Gas费用说明 */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#f0f2f5',
                borderRadius: '8px'
              }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 <strong>Gas费用说明：</strong><br />
                  • Gas Limit: 30,000 units<br />
                  • Gas Price: 20 Gwei<br />
                  • 预估费用: ~0.0006 ETH
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 全屏历史记录弹框 */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space>
                <HistoryOutlined style={{ color: '#1890ff' }} />
                <span>历史记录详情</span>
                <Badge count={history.length + (chainData?.remarkMsgs?.length || 0)} showZero color="#52c41a" />
              </Space>
              <Space>
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    refetch()
                  }}
                  loading={isFetching}
                  size="small"
                >
                  刷新链上数据
                </Button>
                {activeTab === 'local' && history.length > 0 && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={clearAllHistory}
                  >
                    清空本地记录
                  </Button>
                )}
              </Space>
            </div>
          }
          open={isHistoryModalVisible}
          onCancel={() => setIsHistoryModalVisible(false)}
          footer={null}
          width="90vw"
          style={{ top: 20 }}
          styles={{
            body: {
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '20px'
            }
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              // {
              //   key: 'local',
              //   label: (
              //     <Space>
              //       <DatabaseOutlined />
              //       <span>本地记录</span>
              //       <Badge count={history.length} size="small" />
              //     </Space>
              //   ),
              //   children: (
              //     history.length === 0 ? (
              //       <Empty
              //         image={Empty.PRESENTED_IMAGE_SIMPLE}
              //         description={
              //           <span>
              //             暂无本地历史记录<br />
              //             <Text type="secondary">本地操作记录会显示在这里</Text>
              //           </span>
              //         }
              //       />
              //     ) : (
              //       <List
              //         itemLayout="vertical"
              //         size="large"
              //         dataSource={history}
              //         renderItem={(item: HistoryRecord, index: number) => (
              //           <List.Item
              //             key={item.id}
              //             style={{
              //               background: '#fafafa',
              //               marginBottom: '16px',
              //               padding: '20px',
              //               borderRadius: '12px',
              //               border: '1px solid #e8e8e8'
              //             }}
              //             actions={[
              //               <Button
              //                 key="delete"
              //                 type="text"
              //                 size="small"
              //                 danger
              //                 icon={<DeleteOutlined />}
              //                 onClick={() => deleteRecord(item.id)}
              //               >
              //                 删除
              //               </Button>
              //             ].filter(Boolean)}
              //           >
              //             <List.Item.Meta
              //               title={
              //                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              //                   <Space>
              //                     <Tag color="blue">本地记录</Tag>
              //                     <Text strong>#{history.length - index}</Text>
              //                   </Space>
              //                   <Text type="secondary" style={{ fontSize: '12px' }}>
              //                     {item.timestamp}
              //                   </Text>
              //                 </div>
              //               }
              //               description={
              //                 <Descriptions column={1} size="small">
              //                   {item.fullContent && (
              //                     <Descriptions.Item label="内容">
              //                       <div style={{
              //                         maxHeight: '100px',
              //                         overflowY: 'auto',
              //                         background: '#fff',
              //                         padding: '8px',
              //                         borderRadius: '4px',
              //                         border: '1px solid #d9d9d9',
              //                         fontFamily: 'monospace',
              //                         fontSize: '12px'
              //                       }}>
              //                         {safeHexToString(item.fullContent)}
              //                       </div>
              //                     </Descriptions.Item>
              //                   )}
              //                   {item.address && (
              //                     <Descriptions.Item label="钱包地址">
              //                       <Text code style={{ fontSize: '12px' }}>
              //                         {item.address}
              //                       </Text>
              //                     </Descriptions.Item>
              //                   )}
              //                 </Descriptions>
              //               }
              //             />
              //           </List.Item>
              //         )}
              //       />
              //     )
              //   )
              // },
              {
                key: 'chain',
                label: (
                  <Space>
                    <CloudOutlined />
                    <span>链上记录</span>
                    <Badge count={chainData?.remarkMsgs?.length || 0} size="small" />
                  </Space>
                ),
                children: (
                  <Spin spinning={isFetching}>
                    {!chainData?.remarkMsgs || chainData.remarkMsgs.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span>
                            暂无链上记录<br />
                            <Text type="secondary">点击上方"查询链上记录"按钮获取数据</Text>
                          </span>
                        }
                        style={{ padding: '40px' }}
                      />
                    ) : (
                      <List
                        itemLayout="vertical"
                        size="large"
                        dataSource={chainData?.remarkMsgs || []}
                        renderItem={(item: ChainMessage, index: number) => (
                          <List.Item
                            key={item.id}
                            style={{
                              background: '#f6ffed',
                              marginBottom: '16px',
                              padding: '20px',
                              borderRadius: '12px',
                              border: '1px solid #b7eb8f'
                            }}
                            actions={[
                              item.transactionHash && (
                                <Button
                                  key="view"
                                  type="link"
                                  size="small"
                                  icon={<LinkOutlined />}
                                  onClick={() => jumpToView(item.transactionHash as `0x${string}`)}
                                >
                                  查看交易
                                </Button>
                              ),
                              <Button
                                key="copy"
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(item.data, '内容')}
                              >
                                复制内容
                              </Button>
                            ].filter(Boolean)}
                          >
                            <List.Item.Meta
                              title={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Space>
                                    <Tag color="green">链上记录</Tag>
                                    <Text strong>#{index + 1}</Text>
                                    {item.blockNumber && <Tag color="blue">区块 {item.blockNumber}</Tag>}
                                  </Space>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {new Date(parseInt(item.timestamp) * 1000).toLocaleString()}
                                  </Text>
                                </div>
                              }
                              description={
                                <Descriptions column={1} size="small">
                                  <Descriptions.Item label="消息内容">
                                    <div style={{
                                      maxHeight: '100px',
                                      overflowY: 'auto',
                                      background: '#fff',
                                      padding: '8px',
                                      borderRadius: '4px',
                                      border: '1px solid #d9d9d9',
                                      fontFamily: 'monospace',
                                      fontSize: '12px'
                                    }}>
                                      {safeHexToString(item.data)}
                                    </div>
                                  </Descriptions.Item>
                                  <Descriptions.Item label="发送者">
                                    <Text code style={{ fontSize: '12px' }}>
                                      {item.sender}
                                    </Text>
                                  </Descriptions.Item>
                                  {item.transactionHash && (
                                    <Descriptions.Item label="交易哈希">
                                      <Text
                                        code
                                        style={{ fontSize: '12px', cursor: 'pointer' }}
                                        onClick={() => jumpToView(item.transactionHash as `0x${string}`)}
                                      >
                                        {item.transactionHash.slice(0, 10)}...{item.transactionHash.slice(-8)}
                                      </Text>
                                    </Descriptions.Item>
                                  )}
                                </Descriptions>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </Spin>
                )
              }
            ]}
          />
        </Modal>
      </main>
    </div>
  );
};

export default Home;
