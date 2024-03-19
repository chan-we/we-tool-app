import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.less'

import App from './App'
import { Provider } from 'react-redux'
import store from './store'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
)
