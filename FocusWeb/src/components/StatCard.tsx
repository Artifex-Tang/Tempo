import { Card, Statistic } from 'antd';

export function StatCard({ title, value, suffix }: { title: string; value: number | string; suffix?: string }) {
  return (
    <Card size="small">
      <Statistic title={title} value={value} suffix={suffix} />
    </Card>
  );
}
