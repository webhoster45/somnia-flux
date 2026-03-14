import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { WagmiConfig, createConfig, mainnet } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const somniaShannon = {
  id: 50312,
  name: 'Somnia Shannon',
  network: 'somnia-shannon',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
    public: { http: ['https://dream-rpc.somnia.network'] },
  },
}

const config = createConfig({
  autoConnect: true,
  publicClient: createPublicClient({
    chain: somniaShannon,
    transport: http()
  }),
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>,
)
