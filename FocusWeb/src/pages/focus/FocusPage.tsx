import { useEffect, useRef, useState } from 'react';
import { Button, Card, Statistic, Row, Col, message } from 'antd';
import { focus as focusApi } from '../../api';
import type { DailyStat } from '../../types';

const POMODORO = 25 * 60; // 25 分钟

export function FocusPage() {
  const [remaining, setRemaining] = useState(POMODORO);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStats = async () => {
    try {
      setStats(await focusApi.dailyStats(7));
    } catch {
      /* silent */
    }
  };
  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer.current!);
          setRunning(false);
          focusApi
            .record({ durationMin: Math.round(POMODORO / 60) })
            .then(() => {
              message.success('专注完成，已记录');
              loadStats();
            })
            .catch(() => message.error('记录失败'));
          return POMODORO;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const totalWeek = stats.reduce((a, s) => a + (s.totalMin || 0), 0);

  return (
    <Card>
      <Statistic title="番茄钟" value={fmt(remaining)} valueStyle={{ fontSize: 48 }} />
      <Button
        type="primary"
        size="large"
        onClick={() => setRunning((v) => !v)}
        style={{ marginTop: 16 }}
      >
        {running ? '暂停' : '开始专注'}
      </Button>
      <Row gutter={12} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Statistic title="本周专注(分钟)" value={totalWeek} />
        </Col>
        <Col span={12}>
          <Statistic title="记录天数" value={stats.length} />
        </Col>
      </Row>
    </Card>
  );
}
