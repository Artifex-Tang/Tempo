import { Component, type ReactNode } from 'react';
import { Result, Button } from 'antd';

interface State { hasError: boolean; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // 仅记录，不外发
    console.error('FocusWeb 渲染异常:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面异常"
          subTitle="渲染过程发生错误，请重试。"
          extra={<Button type="primary" onClick={() => location.assign('/today')}>回到首页</Button>}
        />
      );
    }
    return this.props.children;
  }
}
