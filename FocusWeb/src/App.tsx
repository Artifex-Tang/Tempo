import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/login/LoginPage';
import { TodayPage } from './pages/today/TodayPage';
import { TodoPage } from './pages/todo/TodoPage';
import { GoalPage } from './pages/goal/GoalPage';
import { FocusPage } from './pages/focus/FocusPage';
import { SummaryPage } from './pages/summary/SummaryPage';
import { CategoryPage } from './pages/category/CategoryPage';

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/today" element={<TodayPage />} />
            <Route path="/todos" element={<TodoPage />} />
            <Route path="/goals" element={<GoalPage />} />
            <Route path="/focus" element={<FocusPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/categories" element={<CategoryPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
