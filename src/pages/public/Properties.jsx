import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { propertiesAPI, interestsAPI } from '../../services/api';
import { shareProperty } from '../../utils/whatsapp';
import { getImageUrl } from '../../utils/imageUrl';

// Custom hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function Properties() {
  const [filters, setFilters] = useState({
    status: '',
    city: '',
    property_type: '',
    min_price: '',
    max_price: '',
  });
  const [page, setPage] = useState(1);
  const limit = 12;

  // Debounce text inputs (city) to avoid API calls on every keystroke
  const debouncedCity = useDebounce(filters.city, 500);
  const debouncedMinPrice = useDebounce(filters.min_price, 500);
  const debouncedMaxPrice = useDebounce(filters.max_price, 500);

  // Create query filters object with debounced values
  const queryFilters = useMemo(() => ({
    status: filters.status,
    city: debouncedCity,
    property_type: filters.property_type,
    min_price: debouncedMinPrice,
    max_price: debouncedMaxPrice,
  }), [filters.status, debouncedCity, filters.property_type, debouncedMinPrice, debouncedMaxPrice]);

  const { data, isLoading, error } = useQuery(
    ['properties', queryFilters, page],
    () => {
      // Remove empty string values for numeric fields to avoid validation errors
      const params = { page, limit };
      // Status can be empty string (means all), so include it if it exists
      if (queryFilters.status !== undefined && queryFilters.status !== null) {
        params.status = queryFilters.status;
      }
      if (queryFilters.city) params.city = queryFilters.city;
      if (queryFilters.property_type) params.property_type = queryFilters.property_type;
      // Only include numeric fields if they have actual values
      if (queryFilters.min_price && queryFilters.min_price !== '') {
        params.min_price = parseFloat(queryFilters.min_price);
      }
      if (queryFilters.max_price && queryFilters.max_price !== '') {
        params.max_price = parseFloat(queryFilters.max_price);
      }
      return propertiesAPI.getAll(params);
    }
  );

  const properties = data?.data?.properties || [];
  const pagination = data?.data?.pagination || {};

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const handleView = (propertyId) => {
    interestsAPI.track({ property_id: propertyId, interest_type: 'view' });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading properties...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading properties: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-midnight-900 to-midnight-950">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-2 md:mb-4">Properties</h1>
        <p className="text-base md:text-lg lg:text-xl text-text-secondary mb-8 md:mb-12">Browse our complete collection of premium auction properties</p>

        {/* Filters */}
        <div className="card p-4 md:p-8 mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
            <div>
              <label className="label block mb-3">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="label block mb-3">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Search city..."
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="label block mb-3">Property Type</label>
              <select
                value={filters.property_type}
                onChange={(e) => handleFilterChange('property_type', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
                <option value="villa">Villa</option>
              </select>
            </div>
            <div>
              <label className="label block mb-3">Min Price (₹)</label>
              <input
                type="number"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                placeholder="Min"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="label block mb-3">Max Price (₹)</label>
              <input
                type="number"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                placeholder="Max"
                className="input-field text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => setFilters({ status: '', city: '', property_type: '', min_price: '', max_price: '' })}
            className="px-6 py-3 bg-gold text-midnight-950 rounded-btn hover:bg-gold-hover transition-all text-sm font-semibold"
          >
            Clear Filters
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">Loading properties...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-950 border border-red-700 rounded-lg p-4 mb-8">
            <p className="text-red-200">Error loading properties: {error.message}</p>
          </div>
        )}

        {/* Properties Grid */}
        {!isLoading && !error && (
          <>
            {properties.length === 0 ? (
              <div className="text-center py-12 card">
                <p className="text-text-secondary text-lg">No properties found matching your criteria.</p>
                <button
                  onClick={() => setFilters({ status: '', city: '', property_type: '', min_price: '', max_price: '' })}
                  className="mt-4 px-4 py-2 bg-gold text-midnight-950 rounded-btn hover:bg-gold-hover transition-all text-sm font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 mb-12">
                  {properties.map((property) => {
                    const imageUrl = property.cover_image_url || 
                      (property.images && property.images.length > 0 
                        ? (typeof property.images[0] === 'object' ? property.images[0].image_url : property.images[0])
                        : null);

                    return (
                    <div
                      key={property.id}
                      className="group card overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                    >
                      <Link to={`/properties/${property.id}`} onClick={() => handleView(property.id)}>
                        <div className="relative h-48 md:h-64 overflow-hidden bg-midnight-800">
                          {imageUrl ? (
                            <img
                              src={getImageUrl(imageUrl)}
                              alt={property.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%231F2A3D" width="400" height="300"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-midnight-800">
                              <span className="text-text-secondary">No Image</span>
                            </div>
                          )}
                          <div className="absolute top-4 right-4">
                            <span className={`px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm ${
                              property.auction_status === 'active' ? 'bg-status-live/90 text-white' :
                              property.auction_status === 'upcoming' ? 'bg-gold/90 text-midnight-950' :
                              'bg-text-secondary/30 text-text-primary'
                            }`}>
                              {property.auction_status === 'active' ? '🔴 Bidding Live' : property.auction_status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <div className="p-4 md:p-6 flex flex-col h-full">
                        <div className="flex-grow">
                          <Link to={`/properties/${property.id}`} onClick={() => handleView(property.id)}>
                            <h3 className="text-lg md:text-2xl font-bold text-white mb-2 group-hover:text-gold transition-colors line-clamp-2 min-h-14 md:min-h-16">
                              {property.title}
                            </h3>
                          </Link>
                          <p className="text-text-secondary text-xs md:text-sm mb-3">
                            📍 {property.city}, {property.state}
                            {property.property_size && ` • ${property.property_size} sq.ft`}
                          </p>
                          {property.property_type && (
                            <p className="text-text-secondary text-xs md:text-sm mb-3">Type: {property.property_type}</p>
                          )}
                          <div className="space-y-1 md:space-y-2">
                            <div>
                              <p className="text-text-secondary text-xs font-semibold uppercase tracking-wide mb-1">Reserve Price</p>
                              <p className="text-lg md:text-2xl font-bold text-gold">
                                ₹{parseFloat(property.reserve_price).toLocaleString('en-IN')}
                              </p>
                            </div>
                            {property.auction_status === 'active' && (
                              <div>
                                <p className="text-status-live text-sm font-bold">✓ Bidding Live</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
                          <Link
                            to={`/properties/${property.id}`}
                            onClick={() => handleView(property.id)}
                            className="flex-1 btn-primary text-center text-xs md:text-sm py-3 md:py-4"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() => {
                              shareProperty(property);
                              interestsAPI.track({ property_id: property.id, interest_type: 'share' });
                            }}
                            className="px-3 md:px-4 py-3 md:py-4 bg-status-live text-white rounded-btn hover:bg-green-600 transition-all"
                            title="Share on WhatsApp"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .96 4.534.96 10.08c0 1.752.413 3.4 1.141 4.865L.06 23.884l9.251-2.39a11.717 11.717 0 005.739 1.49h.005c6.554 0 11.09-5.533 11.09-11.088a11.106 11.106 0 00-3.291-7.918"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex flex-wrap justify-center items-center gap-4">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-6 py-3 bg-midnight-800 text-text-nav rounded-btn disabled:opacity-50 disabled:cursor-not-allowed hover:bg-midnight-700 transition-all font-medium"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-3 text-text-nav text-base">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="px-6 py-3 bg-midnight-800 text-text-nav rounded-btn disabled:opacity-50 disabled:cursor-not-allowed hover:bg-midnight-700 transition-all font-medium"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Properties;
