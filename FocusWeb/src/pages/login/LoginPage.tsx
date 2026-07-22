import { Button, Card, Divider, Typography, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../api';
import { saveLogin } from '../../store/auth';
import { useEffect } from 'react';

const { Title, Text } = Typography;

const IS_DEV = import.meta.env.DEV;
const WX_OAUTH_URL = 'https://open.weixin.qq.com/connect/qrconnect'
  + '?appid=YOUR_APPID&redirect_uri=YOUR_REDIRECT&response_type=code&scope=snsapi_login#wechat_redirect';

export function LoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  // 生产 OAuth 回调：URL 带 ?code=xxx
  useEffect(() => {
    const code = params.get('code');
    if (!code || IS_DEV) return;
    auth.webOAuthCallback(code)
      .then((vo) => { saveLogin(vo); nav('/today'); })
      .catch(() => message.error('微信登录失败'));
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
            <Button type="primary" block href={WX_OAUTH_URL}>微信扫码</Button>
          </>
        )}
      </Card>
    </div>
  );
}
