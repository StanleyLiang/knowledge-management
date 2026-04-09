import './global.css'
import '@lexical-editor/editor/styles.css'
import { Editor } from '@lexical-editor/editor'
import { Component, type ReactNode, type ErrorInfo } from 'react'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Editor error:', error, info) }
  render() {
    if (this.state.error) {
      return <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
    }
    return this.props.children
  }
}

export function App() {
  return (
    <div className="app-container">
      <h1 className="app-title">Rsbuild — Editor Build Verification</h1>
      <ErrorBoundary>
        <Editor />
      </ErrorBoundary>
    </div>
  )
}
