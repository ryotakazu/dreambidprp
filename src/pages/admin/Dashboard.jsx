import { useQuery, useQueryClient } from 'react-query';
import { propertiesAPI, enquiriesAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function Dashboard() {
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch all properties including expired for dashboard stats
  const { data: propertiesData, isLoading: propertiesLoading, refetch: refetchProperties } = useQuery(
    'dashboard-properties',
    () => propertiesAPI.getAll({ limit: 1000, status: '' }), // Empty string = all properties including expired
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true,
    }
  );

  const { data: enquiriesData, isLoading: enquiriesLoading, refetch: refetchEnquiries } = useQuery(
    'enquiries',
    () => enquiriesAPI.getAll({ limit: 1000 }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true,
    }
  );

  const handleRefresh = async () => {
    await Promise.all([refetchProperties(), refetchEnquiries()]);
    setLastRefresh(new Date());
  };

  const properties = propertiesData?.data?.properties || [];
  const enquiries = enquiriesData?.data?.enquiries || [];

  const stats = {
    totalProperties: properties.length,
    activeAuctions: properties.filter(p => p.auction_status === 'active').length,
    upcomingAuctions: properties.filter(p => p.auction_status === 'upcoming').length,
    expiredAuctions: properties.filter(p => p.auction_status === 'expired').length,
    newEnquiries: enquiries.filter(e => e.status === 'new').length,
    totalEnquiries: enquiries.length,
    totalViews: properties.reduce((sum, p) => sum + (p.views_count || 0), 0),
    totalShares: properties.reduce((sum, p) => sum + (p.shares_count || 0), 0),
  };

  if (propertiesLoading || enquiriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={propertiesLoading || enquiriesLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {propertiesLoading || enquiriesLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link
            to="/admin/properties/new"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Add Property
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Properties</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalProperties}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Active Auctions</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeAuctions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Upcoming Auctions</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.upcomingAuctions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">New Enquiries</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.newEnquiries}</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Views</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalViews}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Shares</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalShares}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Enquiries</h3>
          <p className="text-3xl font-bold text-pink-600 mt-2">{stats.totalEnquiries}</p>
        </div>
      </div>

      {/* Recent Enquiries */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Enquiries</h2>
            <Link
              to="/enquiries"
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
        </div>
        <div className="p-6">
          {enquiries.slice(0, 5).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No enquiries yet</p>
          ) : (
            <div className="space-y-4">
              {enquiries.slice(0, 5).map((enquiry) => (
                <div key={enquiry.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{enquiry.name}</p>
                      <p className="text-sm text-gray-600">{enquiry.email} • {enquiry.phone}</p>
                      <p className="text-sm text-gray-500 mt-1">{enquiry.property_title}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      enquiry.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                      enquiry.status === 'contacted' ? 'bg-red-100 text-red-800' :
                      enquiry.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {enquiry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
