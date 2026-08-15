import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './app/store'
import { ThemeProvider } from './context/ThemeContext'
import App from './App'
import './index.css'
import './i18n'
import { readSavedScale, applyScale } from './components/ui/TextSize'

// Applied before the first paint: a reader who chose bigger text should not
// watch the page start small and jump.
applyScale(readSavedScale())

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
)
