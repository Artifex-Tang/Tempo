import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 桌面独占快捷键：N 新建待办（跳今日聚焦输入框）/ 空格在今日翻转选中（简化为提示）/ `/` 聚焦搜索
export function useKeyboardShortcuts() {
  const nav = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (typing) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        nav('/today');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav]);
}
