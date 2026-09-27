import { Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { CreateTripPage } from './pages/CreateTripPage';
import { LoginPage } from './pages/LoginPage';
import { TripLayout } from './pages/TripLayout';
import { HomePage } from './pages/HomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { AddExpensePage } from './pages/AddExpensePage';
import { ExpenseDetailPage } from './pages/ExpenseDetailPage';
import { EditExpensePage } from './pages/EditExpensePage';
import { SettlePage } from './pages/SettlePage';
import { PeoplePage } from './pages/PeoplePage';
import { AdminPage } from './pages/AdminPage';
import { MemberDetailPage } from './pages/MemberDetailPage';
import { AdvancePage } from './pages/AdvancePage';

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/create" element={<CreateTripPage />} />
        <Route path="/trip/:shareToken" element={<TripLayout />}>
          <Route index element={<HomePage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="add-expense" element={<AddExpensePage />} />
          <Route path="expenses/:expenseId" element={<ExpenseDetailPage />} />
          <Route path="expenses/:expenseId/edit" element={<EditExpensePage />} />
          <Route path="settle" element={<SettlePage />} />
          <Route path="advance" element={<AdvancePage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="people/:memberId" element={<MemberDetailPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  );
}
