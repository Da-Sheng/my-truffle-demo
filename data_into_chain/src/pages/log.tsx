import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useStoreData } from '../hooks/useDataToChain'
import styles from '../styles/Home.module.css';
import { useState, useEffect } from 'react';
import {
  type BaseError,
  useAccount,
  useSendTransaction,
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
  Badge
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
  EyeOutlined
} from '@ant-design/icons';
import {
  stringToHex,
  safeHexToString,
  isValidHex
} from '../utils/dataCrypto.js';
import storage from '../utils/storage.js';
import { parseEther, parseGwei } from 'viem';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface HistoryRecord {
  id: number;
  input: string;
  output: string;
  operation: string;
  timestamp: string;
  // hash: `0x${string}`;
  content?: string;
  address?: string;
  fullContent?: string;
}

const Home: NextPage = () => {
  const { isConnected, address } = useAccount();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);

  useEffect(() => {
    const savedHistory = storage.get('log_history') || [];
    setHistory(savedHistory);
  }, []);

  const [form] = Form.useForm();

  const storeData = (data: `0x${string}`) => {
    useStoreData(data)

    message.success('数据提交成功！');
    const convertHistory = storage.get('log_history') || [];
    const newSubmit = {
      id: Date.now(),
      content: data?.substring(0, 50) + '...',
      address: address,
      timestamp: new Date().toLocaleString(),
      // hash: data,
      fullContent: data,
      operation: '数据上链',
      input: data || '',
      output: data
    };
    convertHistory.unshift(newSubmit);
    storage.set('log_history', convertHistory);
    setHistory(convertHistory);
    form.resetFields();
  }
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
    const updatedHistory = history.filter(item => item.id !== id);
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
            <Space>
              <WalletOutlined style={{ color: '#52c41a' }} />
              <Text strong>已连接钱包：</Text>
              <Text code>{address.slice(0, 6)}...{address.slice(-4)}</Text>
            </Space>
          </Card>
        )}

        {/* 历史记录按钮 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
                    block
                    size="large"
                    icon={<SendOutlined />}
                  >
                    {'提交上链'}
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
                <Badge count={history.length} showZero color="#52c41a" />
              </Space>
              <Space>
                {history.length > 0 && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={clearAllHistory}
                  >
                    清空所有
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
          {history.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  暂无历史记录<br />
                  <Text type="secondary">开始使用数据上链功能后，记录会显示在这里</Text>
                </span>
              }
            />
          ) : (
            <List
              itemLayout="vertical"
              size="large"
              dataSource={history}
              renderItem={(item, index) => (
                <List.Item
                  key={item.id}
                  style={{
                    background: '#fafafa',
                    marginBottom: '16px',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e8e8e8'
                  }}
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => deleteRecord(item.id)}
                    >
                      删除
                    </Button>
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space>
                          <Tag color={item.operation === '数据上链' ? 'blue' : 'green'}>
                            {item.operation}
                          </Tag>
                          <Text strong>#{history.length - index}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.timestamp}
                        </Text>
                      </div>
                    }
                    description={
                      <Descriptions column={1} size="small">
                        {item.fullContent && (
                          <Descriptions.Item label="原始内容">
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
                              {safeHexToString(item.fullContent)}
                            </div>
                          </Descriptions.Item>
                        )}
                        {item.input && item.input !== item.fullContent && (
                          <Descriptions.Item label="输入数据">
                            <Text code style={{ fontSize: '12px' }}>
                              {item.input.length > 100 ? `${item.input.substring(0, 100)}...` : item.input}
                            </Text>
                          </Descriptions.Item>
                        )}
                        {item.address && (
                          <Descriptions.Item label="钱包地址">
                            <Text code style={{ fontSize: '12px' }}>
                              {item.address}
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
        </Modal>
      </main>
    </div>
  );
};

export default Home;
