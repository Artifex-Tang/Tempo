import { useEffect, useState } from 'react';
import { Row, Col, List, Checkbox, Input, Skeleton, Empty } from 'antd';
import { todo as todoApi } from '../../api';
import { StatCard } from '../../components/StatCard';
import type { Todo } from '../../types';

export function TodayPage() {
  const [items, setItems] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');

  const load = async () => {
    setLoading(true);
    try { setItems(await todoApi.today()); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const pending = items.filter((t) => t.status !== 1);
  const done = items.filter((t) => t.status === 1);

  const onAdd = async () => {
    const title = draft.trim();
    if (!title) return;
    // 今日页新建的待办默认 dueDate=今日，否则后端 todayList 过滤（dueDate=today OR 超期 OR status=1）匹配不到，导致刚创建就"消失"
    const d = new Date();
    const dueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await todoApi.create({ title, dueDate });
    setDraft('');
    load();
  };

  const onToggle = async (t: Todo) => {
    await todoApi.finish(t.id, t.status === 1 ? 0 : 1);
    load();
  };

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={8}><StatCard title="今日待办" value={pending.length} /></Col>
        <Col span={8}>
          <StatCard title="完成率" value={items.length ? Math.round((done.length / items.length) * 100) : 0} suffix="%" />
        </Col>
        <Col span={8}><StatCard title="已完成" value={done.length} /></Col>
      </Row>
      <Input.Search
        placeholder="新建待办…（回车提交）"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        enterButton="添加"
        onPressEnter={onAdd}
        onSearch={onAdd}
        style={{ marginBottom: 12 }}
      />
      {loading ? (
        <Skeleton active />
      ) : (
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <h4>待办</h4>
            <List
              locale={{ emptyText: <Empty description="无待办" /> }}
              dataSource={pending}
              renderItem={(t) => (
                <List.Item>
                  <Checkbox checked={false} onChange={() => onToggle(t)}>{t.title}</Checkbox>
                </List.Item>
              )}
            />
          </Col>
          <Col xs={24} md={12}>
            <h4>已完成</h4>
            <List
              locale={{ emptyText: <Empty /> }}
              dataSource={done}
              renderItem={(t) => (
                <List.Item>
                  <Checkbox checked onChange={() => onToggle(t)}>{t.title}</Checkbox>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      )}
    </>
  );
}
