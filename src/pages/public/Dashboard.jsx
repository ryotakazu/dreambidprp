import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user activity
        const [activityRes, statsRes] = await Promise.all([
          api.get('/user/activity?limit=10'),
          api.get('/user/activity/stats?daysBack=30')
        ]);

        setActivities(activityRes.data.activities || []);
        setStats(activityRes.data || {});
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getActionLabel = (action) => {
    const labels = {
      'login': '🔐 Logged in',
      'logout': '🚪 Logged out',
      'register': '📝 Registered',
      'profile_updated': '✏️ Updated profile',
      'profile_photo_uploaded': '📸 Uploaded profile photo',
      'profile_photo_deleted': '🗑️ Deleted profile photo',
      'password_changed': '🔑 Changed password',
      'property_created': '🏠 Created property',
      'property_updated': '📝 Updated property',
      'property_deleted': '🗑️ Deleted property',
      'property_viewed': '👁️ Viewed property',
      'property_shortlisted': '⭐ Shortlisted property'
    };
    return labels[action] || action;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.full_name || 'User'}! 👋
              </h1>
              <p className="mt-2 text-gray-600">
                Here's what's happening with your account
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900 font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="text-gray-900 font-medium">{user?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900 font-medium">{user?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-gray-900 font-medium">
                  {new Date(user?.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary (30 days)</h2>
            <div className="space-y-3">
              {stats.length > 0 ? (
                stats.map((stat, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-600">{stat.action}</span>
                    <span className="font-semibold text-gray-900">{stat.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No activity in the last 30 days</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <a
                href="/profile"
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit Profile
              </a>
              <a
                href="/settings"
                className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Settings
              </a>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">
                      {getActionLabel(activity.action)}
                    </p>
                    {activity.data && (
                      <p className="text-sm text-gray-600 mt-1">
                        {JSON.stringify(activity.data).substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(activity.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No activity yet</p>
          )}

          <div className="mt-6 text-center">
            <a href="/activity" className="text-blue-600 hover:text-blue-700 font-medium">
              View All Activity →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
