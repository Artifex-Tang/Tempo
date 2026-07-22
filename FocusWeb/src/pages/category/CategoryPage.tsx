import { useEffect, useState } from 'react';
import { Table, Button, Input, Space, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { category as catApi } from '../../api';
import type { Category } from '../../types';

export function CategoryPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');

  const load = async () => {
    setLoading(true);
    try { setItems(await catApi.list()); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const onAdd = async () => {
    const name = draft.trim();
    if (!name) return;
    await catApi.create({ name });
    setDraft('');
    load();
  };

  const columns: ColumnsType<Category> = [
    { title: '名称', dataIndex: 'name' },
    {
      title: '操作', render: (_, r) => (
        <Popconfirm title="删除该分类？" onConfirm={async () => { await catApi.remove(r.id); load(); }}>
          <Button size="small" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Space.Compact style={{ marginBottom: 12, width: 320 }}>
        <Input placeholder="新分类名" value={draft} onChange={(e) => setDraft(e.target.value)} onPressEnter={onAdd} />
        <Button type="primary" onClick={onAdd}>添加</Button>
      </Space.Compact>
      <Table rowKey="id" loading={loading} dataSource={items} columns={columns} />
    </>
  );
}
