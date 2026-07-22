// 统一响应体 R<T>：对齐 DayCraft 后端 { code, msg, data } 约定
export interface R<T> {
  code: number;
  msg: string;
  data: T;
}

// 登录返回结构（对应后端 LoginVO）
export interface LoginVO {
  token: string;
  userId: number;
  nickname: string;
  avatarUrl: string;
  focusTotal: number;
  isNew: boolean;
}

export interface Todo {
  id: number;
  title: string;
  status: number;
  remindTime?: string;
  categoryId?: number;
  categoryName?: string;
  finishNote?: string;
  createdAt?: string;
}

export interface Goal {
  id: number;
  title: string;
  type: number;
  status: number;
  progress: number;
  finishNote?: string;
  deadline?: string;
}

export interface FocusRecord {
  duration: number;
  categoryId?: number;
  startedAt: string;
}

export interface Category {
  id: number;
  name: string;
  color?: string;
}

export interface DailyStat {
  date: string;
  total: number;
  done: number;
  focusMinutes: number;
}

export interface Summary {
  type: string;
  aiSummary?: string;
  data?: Record<string, unknown>;
}
