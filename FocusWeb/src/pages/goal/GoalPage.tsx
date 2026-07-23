import { useEffect, useState } from 'react';
import { List, Progress, Button, Input, Space, Popconfirm, message } from 'antd';
import { goal as goalApi } from '../../api';
import type { Goal } from '../../types';

export function GoalPage() {
  const [items, setItems] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await goalApi.list());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const onAdd = async () => {
    const title = draft.trim();
    if (!title) return;
    // 后端 GoalDTO.targetDate @NotNull，默认截止=一月后（TODO: 加日期选择器让用户自选）
    const d = new Date(Date.now() + 30 * 86400000);
    const targetDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await goalApi.create({ title, type: 0, status: 0, progress: 0, targetDate });
    setDraft('');
    load();
  };
  const bump = async (g: Goal) => {
    await goalApi.updateProgress(g.id, Math.min(100, g.progress + 10));
    load();
  };
  const finish = async (g: Goal) => {
    await goalApi.finish(g.id, 1);
    message.success('目标已完成');
    load();
  };

  return (
    <>
      <Space.Compact style={{ marginBottom: 12, width: '100%' }}>
        <Input
          placeholder="新建目标…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPressEnter={onAdd}
        />
        <Button type="primary" onClick={onAdd}>
          添加
        </Button>
      </Space.Compact>
      <List
        loading={loading}
        dataSource={items}
        renderItem={(g) => (
          <List.Item
            actions={[
              <Button size="small" key="bump" onClick={() => bump(g)}>
                +10%
              </Button>,
              <Popconfirm
                key="finish"
                title="标记完成？"
                onConfirm={() => finish(g)}
              >
                <Button size="small" type="primary">
                  完成
                </Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={g.title}
              description={
                <Progress
                  percent={g.progress}
                  status={g.status === 1 ? 'success' : 'active'}
                  style={{ maxWidth: 320 }}
                />
              }
            />
          </List.Item>
        )}
      />
    </>
  );
}
