import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="zh-CN">
            <Head>
                <meta charSet="utf-8" />
                <meta name="description" content="基于区块链的数据存储平台" />
                <meta name="keywords" content="区块链,数据上链,以太坊,Web3" />
                <meta name="author" content="Data Into Chain Platform" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
} 