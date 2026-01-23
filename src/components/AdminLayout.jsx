import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/admin/dashboard" className="text-xl font-bold text-red-600">
                DreamBid Admin
              </Link>
              <Link to="/" className="text-gray-700 hover:text-red-600">
                Home
              </Link>
              <Link to="/admin/dashboard" className="text-gray-700 hover:text-red-600">
                Dashboard
              </Link>
              <Link to="/admin/properties" className="text-gray-700 hover:text-red-600">
                Properties
              </Link>
              <Link to="/admin/enquiries" className="text-gray-700 hover:text-red-600">
                Enquiries
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-600">
                  {user.full_name} ({user.role})
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 px-3 py-1 rounded hover:bg-red-50 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

