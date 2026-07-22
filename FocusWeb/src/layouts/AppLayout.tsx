import { Layout, Menu } from 'antd';
import {
  HomeOutlined, ClockCircleOutlined, AimOutlined,
  BarChartOutlined, UnorderedListOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const { Sider, Content, Header } = Layout;

const ITEMS = [
  { key: '/today', icon: <HomeOutlined />, label: '今日' },
  { key: '/todos', icon: <UnorderedListOutlined />, label: '待办' },
  { key: '/goals', icon: <AimOutlined />, label: '目标' },
  { key: '/focus', icon: <ClockCircleOutlined />, label: '专注' },
  { key: '/summary', icon: <BarChartOutlined />, label: '汇总' },
  { key: '/categories', icon: <AppstoreOutlined />, label: '分类' },
];

export function AppLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useKeyboardShortcuts();

  const activeKey = '/' + loc.pathname.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider breakpoint="md" theme="light">
          <div style={{ height: 56, margin: 16, fontWeight: 700 }}>Tempo</div>
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            items={ITEMS}
            onClick={({ key }) => nav(key)}
          />
        </Sider>
      )}
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', textAlign: 'right' }}>
          Tempo · 个人事务
        </Header>
        <Content style={{ padding: 16, paddingBottom: isMobile ? 64 : 16 }}>
          <Outlet />
        </Content>
      </Layout>
      {isMobile && (
        <Menu
          mode="horizontal"
          selectedKeys={[activeKey]}
          items={ITEMS}
          style={{ position: 'fixed', bottom: 0, width: '100%', zIndex: 10 }}
          onClick={({ key }) => nav(key)}
        />
      )}
    </Layout>
  );
}
