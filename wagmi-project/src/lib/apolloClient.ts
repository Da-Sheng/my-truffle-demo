import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

// 创建HTTP链接
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_TICKET_API_HOST || 'http://localhost:8787/graphql',
})

// 创建Apollo客户端
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
})

export default apolloClient 