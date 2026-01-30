import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { UserRole } from '@dietistapp/shared';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientDiaryPage from './pages/ClientDiaryPage';
import DietitianDashboardPage from './pages/DietitianDashboardPage';
import RecipesPage from './pages/RecipesPage';

// Components
import Layout from './components/common/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Kontrollerar autentisering..." />;
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<Layout />}>
          <Route
            path="/diary"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
                <ClientDiaryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DIETITIAN, UserRole.ADMIN]}>
                <DietitianDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recipes"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CLIENT, UserRole.DIETITIAN]}>
                <RecipesPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/diary" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
