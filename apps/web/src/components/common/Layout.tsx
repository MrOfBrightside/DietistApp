import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '@dietistapp/shared';

export default function Layout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link to="/" className="flex items-center text-xl font-bold text-primary-600">
                DietistApp
              </Link>

              {user?.role === UserRole.CLIENT && (
                <>
                  <Link to="/diary" className="flex items-center px-3 hover:text-primary-600">
                    Dagbok
                  </Link>
                  <Link to="/recipes" className="flex items-center px-3 hover:text-primary-600">
                    Recept
                  </Link>
                </>
              )}

              {(user?.role === UserRole.DIETITIAN || user?.role === UserRole.ADMIN) && (
                <>
                  <Link to="/dashboard" className="flex items-center px-3 hover:text-primary-600">
                    Dashboard
                  </Link>
                  <Link to="/recipes" className="flex items-center px-3 hover:text-primary-600">
                    Recept
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button onClick={logout} className="btn btn-secondary">
                Logga ut
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            Data från{' '}
            <a
              href="https://www.livsmedelsverket.se"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Livsmedelsverket
            </a>{' '}
            - Licens{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              CC BY 4.0
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
