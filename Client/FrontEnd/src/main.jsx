// Import the React library
import React from 'react'
// Import the ReactDOM client to render the app
import ReactDOM from 'react-dom/client'
// Import the main App component
import App from './App.jsx'
// Import the global CSS styles (Tailwind)
import './index.css'

// Render the React application into the root element
ReactDOM.createRoot(document.getElementById('root')).render(
  // Use StrictMode for highlighting potential problems
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
