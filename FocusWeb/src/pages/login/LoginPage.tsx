import { Button, Card, Divider, Typography, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../api';
import { saveLogin } from '../../store/auth';
import { useEffect } from 'react';

const { Title, Text } = Typography;

const IS_DEV = import.meta.env.DEV;
// 生产微信网页 OAuth：appid/redirect 通过构建期环境变量注入（FocusWeb/.env 的 VITE_WX_*）
const WX_APPID = import.meta.env.VITE_WX_APPID;
const WX_REDIRECT_URI = import.meta.env.VITE_WX_REDIRECT_URI;
const wxOAuthUrl = WX_APPID && WX_REDIRECT_URI
  ? 'https://open.weixin.qq.com/connect/qrconnect'
    + `?appid=${encodeURIComponent(WX_APPID)}`
    + `&redirect_uri=${encodeURIComponent(WX_REDIRECT_URI)}`
    + '&response_type=code&scope=snsapi_login#wechat_redirect'
  : null;

export function LoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  // 生产 OAuth 回调：URL 带 ?code=xxx
  useEffect(() => {
    const code = params.get('code');
    if (!code || IS_DEV) return;
    auth.webOAuthCallback(code)
      .then((vo) => { saveLogin(vo); nav('/today'); })
      .catch(() => {
        message.error('微信登录失败');
        nav('/login', { replace: true }); // 清掉已用的 code，避免刷新重复失败
      });
  }, [params, nav]);

  const onMockLogin = async () => {
    try {
      const vo = await auth.webMockLogin();
      saveLogin(vo);
      nav('/today');
    } catch {
      message.error('mock 登录失败，请确认后端已启用 WX_MOCK_OPENID');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Card style={{ width: 360, textAlign: 'center' }}>
        <Title level={3}>Tempo · 登录</Title>
        {IS_DEV ? (
          <>
            <Text type="secondary">开发模式</Text>
            <Divider />
            <Button type="primary" block onClick={onMockLogin}>一键 Mock 登录</Button>
          </>
        ) : (
          <>
            <Text type="secondary">请使用微信扫码登录</Text>
            <Divider />
            {wxOAuthUrl ? (
              <Button type="primary" block href={wxOAuthUrl}>微信扫码</Button>
            ) : (
              <Text type="danger">未配置微信登录（需设置 VITE_WX_APPID / VITE_WX_REDIRECT_URI）</Text>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
