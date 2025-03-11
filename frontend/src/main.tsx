import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './clients/queryClient.ts'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { setNavigate } from './lib/navigate.ts'
import { Provider } from 'react-redux'
import store from './store/index.ts'

const NavigationSetter: React.FC = () => {
  const navigate = useNavigate();
  setNavigate(navigate);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <NavigationSetter />
          <App />
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)

