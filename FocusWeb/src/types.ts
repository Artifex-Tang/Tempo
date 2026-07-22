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
  dueDate?: string;
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

export interface Category {
  id: number;
  name: string;
  color?: string;
}

export interface DailyStat { day: string; totalMin: number; }

export interface Summary {
  id?: number;
  userId?: number;
  type?: number;
  periodStart?: string;
  periodEnd?: string;
  todoTotal: number;
  todoDone: number;
  focusTotalMin: number;
  goalTotal: number;
  goalDone: number;
  aiSummary?: string;
  createdAt?: string;
}
