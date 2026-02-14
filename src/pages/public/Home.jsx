import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { propertiesAPI } from '../../services/api';
import { shareProperty } from '../../utils/whatsapp';
import { getImageUrl } from '../../utils/imageUrl';
import { useShortlist } from '../../contexts/ShortlistContext';

// Custom hook for typing effect
function useTypewriter(text, speed = 50) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayedText;
}

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

function Home() {
  const { toggleShortlist, isShortlisted } = useShortlist();
  const scrollContainerRef = useRef(null);
  const [filters, setFilters] = useState({
    city: '',
    property_type: '',
    budget: '',
  });

  // Typewriter effect for hero title
  const heroText = 'Invest in Curated Luxury Real Estate Through Transparent Bidding';
  const displayedText = useTypewriter(heroText, 30);

  // Debounce text inputs (city) to avoid API calls on every keystroke
  const debouncedCity = useDebounce(filters.city, 500);

  // Create query filters object with debounced values
  const queryFilters = useMemo(() => ({
    city: debouncedCity,
    property_type: filters.property_type,
    max_price: filters.budget ? parseInt(filters.budget) : '',
  }), [debouncedCity, filters.property_type, filters.budget]);

  const { data: featuredData } = useQuery(
    ['featured-properties', queryFilters],
    () => {
      // Remove empty string values for numeric fields to avoid validation errors
      const params = { limit: 6 };
      if (queryFilters.city) params.city = queryFilters.city;
      if (queryFilters.property_type) params.property_type = queryFilters.property_type;
      // Only include numeric fields if they have actual values
      if (queryFilters.max_price && queryFilters.max_price !== '') {
        params.max_price = parseFloat(queryFilters.max_price);
      }
      return propertiesAPI.getAll(params);
    }
  );

  const properties = featuredData?.data?.properties || [];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      {/* Hero Section with Overlaid Search Bar */}
      <div className="relative bg-gradient-to-b from-midnight-950 to-midnight-900 text-white pt-12 md:pt-20 pb-32 md:pb-48 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative max-w-4xl mx-auto px-4 md:px-16 mb-12">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 md:mb-8 leading-tight text-text-primary min-h-32 md:min-h-40">
            {displayedText}
            <span className={`ml-1 ${displayedText.length === heroText.length ? 'hidden' : 'inline-block w-1 h-12 md:h-16 bg-gold animate-pulse'}`}></span>
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-text-muted mb-8 md:mb-10 max-w-2xl leading-relaxed">
            A premium platform crafted for serious investors to discover, evaluate, and bid on high-value properties with trust and clarity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/properties"
              className="btn-primary inline-flex items-center justify-center gap-2 text-center"
            >
              Explore Properties
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link to="/register" className="btn-secondary inline-flex items-center justify-center gap-2 text-center">
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="relative -mt-20 sm:-mt-24 md:-mt-32 px-4 sm:px-6 md:px-8 pb-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-midnight-800 rounded-2xl shadow-2xl overflow-hidden border border-midnight-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 p-0">
              {/* Search Locality Input */}
              <div className="border-b md:border-b-0 md:border-r border-midnight-700 p-6">
                <label className="block text-xs font-semibold text-text-soft uppercase tracking-wide mb-3">Search Locality, City or State</label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder="Enter location"
                  className="w-full px-4 py-3 bg-midnight-800 border-b-2 border-midnight-700 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-gold transition"
                />
              </div>

              {/* Budget Dropdown */}
              <div className="border-b md:border-b-0 md:border-r border-midnight-700 p-6">
                <label className="block text-xs font-semibold text-text-soft uppercase tracking-wide mb-3">Budget</label>
                <select
                  value={filters.budget}
                  onChange={(e) => handleFilterChange('budget', e.target.value)}
                  className="w-full px-4 py-3 bg-midnight-800 border-b-2 border-midnight-700 text-text-primary text-sm focus:outline-none focus:border-gold transition appearance-none cursor-pointer"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23CBA135' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px'}}
                >
                  <option value="">- Select from dropdown -</option>
                  <option value="2000000">Under 20L</option>
                  <option value="4000000">20-40L</option>
                  <option value="6000000">40-60L</option>
                  <option value="10000000">60L-1Cr</option>
                  <option value="20000000">1-2Cr</option>
                  <option value="50000000">2-5Cr</option>
                  <option value="999999999">Above 5Cr</option>
                </select>
              </div>

              {/* Property Type Dropdown */}
              <div className="border-b md:border-b-0 md:border-r border-midnight-700 p-6">
                <label className="block text-xs font-semibold text-text-soft uppercase tracking-wide mb-3">Property Type</label>
                <select
                  value={filters.property_type}
                  onChange={(e) => handleFilterChange('property_type', e.target.value)}
                  className="w-full px-4 py-3 bg-midnight-800 border-b-2 border-midnight-700 text-text-primary text-sm focus:outline-none focus:border-gold transition appearance-none cursor-pointer"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23CBA135' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px'}}
                >
                  <option value="">- Select from dropdown -</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                  <option value="villa">Villa</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="p-6 flex items-end">
                <Link
                  to="/properties"
                  state={{ filters: filters }}
                  className="w-full px-6 py-3 bg-gold text-midnight-950 rounded-lg hover:bg-gold-hover focus:outline-none focus:ring-2 focus:ring-gold transition-all font-semibold text-center shadow-md hover:shadow-lg"
                >
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="bg-gradient-to-b from-midnight-900 to-midnight-950 px-4 md:px-8 py-12 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-10 md:mb-16">Featured Properties</h2>

          {properties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted">No properties available at the moment.</p>
              <p className="text-text-secondary text-sm mt-2">Check back soon for new listings!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
              {properties.map((property) => {
                const imageUrl = property.cover_image_url || 
                  (property.images && property.images.length > 0 
                    ? (typeof property.images[0] === 'object' ? property.images[0].image_url : property.images[0])
                    : null);

                return (
                <div key={property.id} className="group card overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
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
                  </div>
                  <div className="p-4 md:p-6 flex flex-col">
                    <div className="flex-grow">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 min-h-14 md:min-h-16 line-clamp-2">{property.title}</h3>
                      <p className="text-text-secondary text-xs md:text-sm mb-3">
                        📍 {property.city}, {property.state} • {property.property_size} sq.ft
                      </p>
                      <div className="space-y-1 md:space-y-2">
                        <div>
                          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wide mb-1">Reserve Price</p>
                          <p className="text-lg md:text-2xl font-bold text-gold">₹{parseFloat(property.reserve_price).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 md:gap-3 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-midnight-700">
                      <Link
                        to={`/properties/${property.id}`}
                        className="flex-1 btn-primary text-center text-xs md:text-sm py-3 md:py-4"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => shareProperty(property)}
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
          )}

          {properties.length > 0 && (
            <div className="text-center mt-20">
              <Link
                to="/properties"
                className="btn-primary inline-flex items-center gap-2"
              >
                View All Properties
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* More Properties Section - Horizontal Carousel */}
      <div className="bg-gradient-to-b from-midnight-950 to-midnight-900 px-4 md:px-8 py-12 md:py-24">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-10 md:mb-16">More Properties</h2>

          {properties.length > 0 && (
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden">
                <div className="flex gap-6 md:gap-8 animate-scroll">
                  {/* Duplicate properties for infinite loop effect */}
                  {[...properties, ...properties].map((property, index) => {
                    const imageUrl = property.cover_image_url || 
                      (property.images && property.images.length > 0 
                        ? (typeof property.images[0] === 'object' ? property.images[0].image_url : property.images[0])
                        : null);

                    return (
                      <div key={`${property.id}-${index}`} className="flex-shrink-0 w-80 md:w-96">
                        <div className="card overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                          <div className="relative h-48 md:h-56 overflow-hidden bg-midnight-800">
                            {imageUrl ? (
                              <img
                                src={getImageUrl(imageUrl)}
                                alt={property.title}
                                className="w-full h-full object-cover hover:scale-110 transition duration-300"
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
                          <div className="p-4 md:p-6 flex-grow flex flex-col">
                            <h3 className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-2">{property.title}</h3>
                            <p className="text-text-secondary text-xs md:text-sm mb-3">
                              📍 {property.city}, {property.state} • {property.property_size} sq.ft
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-gold mb-4 flex-grow">₹{parseFloat(property.reserve_price).toLocaleString('en-IN')}</p>
                            <div className="flex gap-2 md:gap-3 pt-4 md:pt-6 border-t border-midnight-700">
                              <Link
                                to={`/properties/${property.id}`}
                                className="flex-1 btn-primary text-center text-xs md:text-sm py-3 md:py-4"
                              >
                                View Details
                              </Link>
                              <button
                                onClick={() => shareProperty(property)}
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gradient Overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-midnight-950 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-midnight-950 to-transparent z-10 pointer-events-none"></div>
            </div>
          )}
        </div>
      </div>

      {/* Your Buying Process Section */}
      <div id="buying-process" className="bg-white px-4 md:px-8 py-16 md:py-24 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm md:text-base font-semibold text-gold mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">The <span className="text-blue-600">Buying Process</span></h2>
            <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">How to buy properties from banks? We're here to guide you through the process, making your property acquisition journey seamless and hassle-free.</p>
          </div>

          {/* Horizontal Carousel */}
          <div className="relative">
            {/* Scroll Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto pb-8 scroll-smooth hide-scrollbar"
              style={{ scrollBehavior: 'smooth' }}
            >
              {/* Step 1 */}
              <div className="flex-shrink-0 w-full md:w-1/4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-6 border border-cyan-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-gray-900">01</span>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Choose a Property</h3>
                <p className="text-gray-700 text-sm">Explore our listings & find a property that meets your requirements.</p>
              </div>

              {/* Step 2 */}
              <div className="flex-shrink-0 w-full md:w-1/4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-6 border border-cyan-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">02</span>
                  </div>
                  <svg className="w-6 h-6 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Pay EMD</h3>
                <p className="text-gray-700 text-sm">Pay 10% earnest money deposit as an assurance of interest in the property.</p>
              </div>

              {/* Step 3 */}
              <div className="flex-shrink-0 w-full md:w-1/4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">03</span>
                  </div>
                  <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Submit Application</h3>
                <p className="text-gray-700 text-sm">Submit the Common Application Form (CAF) and prepare for auction.</p>
              </div>

              {/* Step 4 */}
              <div className="flex-shrink-0 w-full md:w-1/4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">04</span>
                  </div>
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zM5 20a6 6 0 0110-12 6 6 0 0110 12H5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Participate in Auction</h3>
                <p className="text-gray-700 text-sm">Register with the auction portal and take part in the bidding process.</p>
              </div>

              {/* Step 5 */}
              <div className="flex-shrink-0 w-full md:w-1/4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">05</span>
                  </div>
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Auction Outcome</h3>
                <p className="text-gray-700 text-sm">If you win, pay 15%. If you lose, get the EMD refund.</p>
              </div>

              {/* Step 6 */}
              <div className="flex-shrink-0 w-full md:w-1/4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-gray-900">06</span>
                  </div>
                  <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Pay 75% in 15 Days</h3>
                <p className="text-gray-700 text-sm">Pay the remaining 75% within 15 Days to start the registration process.</p>
              </div>

              {/* Step 7 */}
              <div className="flex-shrink-0 w-full md:w-1/4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">07</span>
                  </div>
                  <svg className="w-6 h-6 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Obtain Sale Certificate</h3>
                <p className="text-gray-700 text-sm">The seller institution issues the sale certificate after payment completion.</p>
              </div>

              {/* Step 8 */}
              <div className="flex-shrink-0 w-full md:w-1/4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">08</span>
                  </div>
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l4-4m0 0l4 4m-4-4V5" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Register the Property</h3>
                <p className="text-gray-700 text-sm">Authorized officer registers the property in the Sub-Registrar Office.</p>
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => {
                  if (scrollContainerRef?.current) {
                    scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                  }
                }}
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (scrollContainerRef?.current) {
                    scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                  }
                }}
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Timeline Line */}
            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-red-400 -mt-8 hidden md:block"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
