import { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { todo as todoApi } from '../../api';
import type { Todo } from '../../types';

export function TodoPage() {
  const [items, setItems] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await todoApi.list());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const batchFinish = async () => {
    await Promise.all(selected.map((id) => todoApi.finish(id, 1)));
    message.success(`完成 ${selected.length} 项`);
    setSelected([]);
    load();
  };
  const batchDelete = async () => {
    await Promise.all(selected.map((id) => todoApi.remove(id)));
    message.success(`删除 ${selected.length} 项`);
    setSelected([]);
    load();
  };

  const columns: ColumnsType<Todo> = [
    { title: '标题', dataIndex: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: number) =>
        s === 1 ? <Tag color="green">已完成</Tag> : <Tag>待办</Tag>,
    },
    { title: '分类', dataIndex: 'categoryName' },
    {
      title: '操作',
      render: (_, r) => (
        <Popconfirm
          title="删除？"
          onConfirm={async () => {
            await todoApi.remove(r.id);
            load();
          }}
        >
          <Button size="small" danger>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button disabled={!selected.length} onClick={batchFinish}>
          批量完成
        </Button>
        <Popconfirm title="删除选中？" onConfirm={batchDelete}>
          <Button danger disabled={!selected.length}>
            批量删除
          </Button>
        </Popconfirm>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selected,
          onChange: (keys) => setSelected(keys as number[]),
        }}
      />
    </>
  );
}
