import { useEffect, useState } from 'react';
import { Card, Tabs, Typography, Button, Skeleton, Row, Col, Statistic, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { summary as summaryApi, focus as focusApi, todo as todoApi } from '../../api';
import type { DailyStat, Summary } from '../../types';

const { Paragraph } = Typography;

export function SummaryPage() {
  const [tab, setTab] = useState<'weekly' | 'monthly'>('weekly');
  const [weekly, setWeekly] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<Summary | null>(null);
  const [focusStats, setFocusStats] = useState<DailyStat[]>([]);
  const [todoAgg, setTodoAgg] = useState<{ total: number; done: number }>({ total: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [w, m, f, t] = await Promise.all([
        summaryApi.weekly().catch(() => null),
        summaryApi.monthly().catch(() => null),
        focusApi.dailyStats(7).catch(() => []),
        todoApi.statistics(7).catch(() => ({ total: 0, done: 0 })),
      ]);
      setWeekly(w);
      setMonthly(m);
      setFocusStats(f);
      setTodoAgg(t);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const genSummary = async () => {
    setGenerating(true);
    try {
      await summaryApi.generate(tab === 'weekly' ? '1' : '2');
      load();
    } catch {
      /* client.ts 已经 toast 错误 */
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <Skeleton active />;

  const s = (tab === 'weekly' ? weekly : monthly) as Summary | null;
  const rate = s && s.todoTotal ? Math.round((s.todoDone / s.todoTotal) * 100) : 0;

  return (
    <>
      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as 'weekly' | 'monthly')}
        items={[{ key: 'weekly', label: '周报' }, { key: 'monthly', label: '月报' }]}
        style={{ marginBottom: 12 }}
      />
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={6}><Card size="small"><Statistic title="待办总数" value={s?.todoTotal ?? 0} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已完成" value={s?.todoDone ?? 0} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="完成率" value={rate} suffix="%" /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="专注(分钟)" value={s?.focusTotalMin ?? 0} /></Card></Col>
      </Row>
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={6}><Card size="small"><Statistic title="目标总数" value={s?.goalTotal ?? 0} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="目标达成" value={s?.goalDone ?? 0} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="近7天待办" value={todoAgg.total} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="近7天完成" value={todoAgg.done} /></Card></Col>
      </Row>
      <Card title="专注时长分布（近 7 天·分钟）" style={{ marginBottom: 12 }}>
        {focusStats.length === 0 ? (
          <Empty description="暂无专注记录" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={focusStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalMin" name="专注" fill="#722ed1" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
      <Card title="AI 汇总" extra={<Button size="small" loading={generating} onClick={genSummary}>生成</Button>}>
        <Paragraph>{s?.aiSummary || '点击「生成」获取 AI 汇总（需后端配置 AI_ENABLED）。'}</Paragraph>
      </Card>
    </>
  );
}
