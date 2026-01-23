import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { propertiesAPI, enquiriesAPI, interestsAPI } from '../../services/api';
import { contactViaWhatsApp, shareProperty } from '../../utils/whatsapp';
import { getImageUrl } from '../../utils/imageUrl';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import toast from 'react-hot-toast';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const buyingProcessSteps = [
  { 
    number: 1, 
    title: 'Register', 
    description: 'Sign up on platform',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
  },
  { 
    number: 2, 
    title: 'Explore', 
    description: 'Browse properties',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
  },
  { 
    number: 3, 
    title: 'Inspect', 
    description: 'Visit property site',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
  },
  { 
    number: 4, 
    title: 'Documents', 
    description: 'Review legal papers',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  { 
    number: 5, 
    title: 'EMD Payment', 
    description: 'Deposit earnest money',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
  },
  { 
    number: 6, 
    title: 'Participate', 
    description: 'Join online auction',
    icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
  },
  { 
    number: 7, 
    title: 'Win Bid', 
    description: 'Complete payment',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  { 
    number: 8, 
    title: 'Possession', 
    description: 'Get ownership transfer',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
];

function PropertyDetail() {
  const { id } = useParams();
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showInfoWindow, setShowInfoWindow] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [kycFile, setKycFile] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { data, isLoading, error } = useQuery(
    ['property', id],
    () => propertiesAPI.getById(id),
    {
      onSuccess: () => {
        interestsAPI.track({ property_id: parseInt(id), interest_type: 'view' });
      },
    }
  );

  const enquiryMutation = useMutation(
    (data) => enquiriesAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Expression of Interest submitted successfully!');
        setEnquiryForm({ name: '', email: '', phone: '', message: '' });
        setKycFile(null);
        setAcceptedTerms(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit enquiry');
      },
    }
  );

  const property = data?.data?.property;

  const center = useMemo(() => {
    if (property?.latitude && property?.longitude) {
      return { lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) };
    }
    return null;
  }, [property?.latitude, property?.longitude]);

  const handleEnquirySubmit = (e) => {
    e.preventDefault();
    enquiryMutation.mutate({
      property_id: parseInt(id),
      ...enquiryForm,
    });
  };

  const handleWhatsAppContact = () => {
    contactViaWhatsApp(property, enquiryForm);
    interestsAPI.track({ property_id: parseInt(id), interest_type: 'contact' });
  };

  const handleGetDirections = () => {
    if (center) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleViewOnGoogleMaps = () => {
    if (center) {
      const url = `https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setKycFile(file);
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setKycFile(file);
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-gray-600">Loading property details...</div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-red-200 rounded-xl shadow-sm p-6">
            <p className="text-red-800">Property not found or error loading property.</p>
            <Link to="/properties" className="text-red-600 hover:text-red-700 mt-4 inline-block font-medium">
              ← Back to Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Image Modal */}
      {showImageModal && ((property.images && property.images.length > 0) || property.cover_image_url) && (() => {
        const allImages = [];
        if (property.cover_image_url) {
          allImages.push(property.cover_image_url);
        }
        if (property.images && property.images.length > 0) {
          property.images.forEach(img => {
            const imgUrl = typeof img === 'object' ? img.image_url : img;
            if (imgUrl !== property.cover_image_url) {
              allImages.push(imgUrl);
            }
          });
        }
        const currentImage = allImages[selectedImageIndex] || allImages[0];

        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                  }}
                  className="absolute left-4 text-white hover:text-red-500 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-4 text-white hover:text-red-500 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            <div className="max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={getImageUrl(currentImage)}
                alt={property.title}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onError={(e) => {
                  console.error('Image failed to load:', e.target.src);
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
              {allImages.length > 1 && (
                <div className="text-center text-white mt-4">
                  <span className="text-sm">{selectedImageIndex + 1} / {allImages.length}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Property Content (70%) */}
          <div className="flex-1 space-y-8">
            {/* Property Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#F7F9FC] text-[#6B7280] text-sm font-medium rounded-lg">
                    Property ID: {property.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      className="p-2 rounded-lg hover:bg-[#F7F9FC] transition-colors"
                    >
                      <svg className={`w-5 h-5 ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleWhatsAppContact}
                      className="p-2 rounded-lg hover:bg-[#F7F9FC] transition-colors"
                    >
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .96 4.534.96 10.08c0 1.752.413 3.4 1.141 4.865L.06 23.884l9.251-2.39a11.717 11.717 0 005.739 1.49h.005c6.554 0 11.09-5.533 11.09-11.088a11.106 11.106 0 00-3.291-7.918"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
                {property.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Reserve Price:</span>
                  <span className="text-2xl lg:text-3xl font-bold text-gray-900">
                    ₹{property.reserve_price ? property.reserve_price.toLocaleString() : 'N/A'}
                  </span>
                </div>
                {property.estimated_market_value && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">
                      Est. Market Value: ₹{property.estimated_market_value.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Details & Auction Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Details Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                <div className="space-y-3">
                  {property.property_type && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Property Type</span>
                      <span className="text-sm font-medium text-gray-900">{property.property_type}</span>
                    </div>
                  )}
                  {property.area && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Area</span>
                      <span className="text-sm font-medium text-gray-900">{property.area} sq.ft.</span>
                    </div>
                  )}
                  {property.bedrooms && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Bedrooms</span>
                      <span className="text-sm font-medium text-gray-900">{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Bathrooms</span>
                      <span className="text-sm font-medium text-gray-900">{property.bathrooms}</span>
                    </div>
                  )}
                  {property.city && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">City</span>
                      <span className="text-sm font-medium text-gray-900">{property.city}</span>
                    </div>
                  )}
                  {property.state && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">State</span>
                      <span className="text-sm font-medium text-gray-900">{property.state}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Auction Details Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Details</h3>
                <div className="space-y-3">
                  {property.auction_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Auction Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(property.auction_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {property.earnest_money_deposit && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">EMD Amount</span>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{property.earnest_money_deposit.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {property.status && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
                        property.status === 'upcoming' ? 'bg-blue-50 text-blue-700' :
                        property.status === 'active' ? 'bg-green-50 text-green-700' :
                        property.status === 'expired' ? 'bg-red-50 text-red-700' :
                        property.status === 'sold' ? 'bg-purple-50 text-purple-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            {((property.images && property.images.length > 0) || property.cover_image_url) && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Images</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {property.cover_image_url && (
                    <div
                      className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setSelectedImageIndex(0);
                        setShowImageModal(true);
                      }}
                    >
                      <img
                        src={getImageUrl(property.cover_image_url)}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {property.images && property.images.map((img, index) => {
                    const imgUrl = typeof img === 'object' ? img.image_url : img;
                    const actualIndex = property.cover_image_url ? index + 1 : index;
                    return (
                      <div
                        key={index}
                        className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setSelectedImageIndex(actualIndex);
                          setShowImageModal(true);
                        }}
                      >
                        <img
                          src={getImageUrl(imgUrl)}
                          alt={`Property ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Map Section */}
            {center && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Street View</h4>
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <iframe
                        src={`https://maps.google.com/maps?q=${center.lat},${center.lng}&layer=c&cbll=${center.lat},${center.lng}&cbp=11,0,0,0,0`}
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Exact Location</h4>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <LoadScript googleMapsApiKey="YOUR_API_KEY">
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={center}
                          zoom={15}
                          options={mapOptions}
                        >
                          <Marker position={center} />
                        </GoogleMap>
                      </LoadScript>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleGetDirections}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    Get Directions
                  </button>
                  <button
                    onClick={handleViewOnGoogleMaps}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    View on Google Maps
                  </button>
                </div>
              </div>
            )}

            {/* Information Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Property Information</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Seller's Reserve Price</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The reserve price is the minimum price the seller is willing to accept for the property. 
                    Bids below this price will not be considered. The reserve price is confidential and 
                    not disclosed to bidders.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Estimated Market Value</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    This is an approximate valuation of the property based on current market conditions, 
                    location, property features, and recent comparable sales in the area. This is for 
                    reference purposes only and may not reflect the final auction price.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Earnest Money Deposit (EMD)</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    EMD is a security deposit that must be paid by interested bidders to participate in 
                    the auction. This amount is refundable to unsuccessful bidders and adjusted against 
                    the final payment for successful bidders.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Loan Availability</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Financial institutions may provide loans for eligible properties. Subject to 
                    bank's terms, conditions, and approval processes. Buyers are advised to check 
                    loan eligibility before participating in the auction.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Request a Visit of the Property</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Interested buyers can schedule a property visit by contacting our team. 
                    Site visits are subject to availability and must be scheduled in advance. 
                    Please bring valid identification for verification.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Possession Status</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The possession timeline varies depending on the property type and legal status. 
                    Typically, possession is handed over within 30-90 days after successful payment 
                    completion and legal formalities.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">CERSAI Report</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Central Registry of Securitisation Asset Reconstruction and Security Interest of India 
                    report provides information about any existing securities or mortgages on the property.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Encumbrance Certificate</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    This certificate confirms that the property is free from any legal or financial 
                    liabilities. It's a crucial document that verifies the clear title of the property.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Payment Process for Repossessed Properties</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Payment must be completed within the specified timeframe after winning the bid. 
                    The process includes EMD adjustment, remaining payment, and documentation. 
                    Detailed payment instructions will be provided to successful bidders.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">SARFAESI Act</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The Securitisation and Reconstruction of Financial Assets and Enforcement of 
                    Security Interest Act enables banks to recover their dues without intervention 
                    of the court, making the auction process more efficient.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    <strong>Disclaimer:</strong> The information provided is for reference purposes only. 
                    Buyers are advised to conduct independent due diligence and verify all details before 
                    making any purchase decisions. The platform is not responsible for any inaccuracies 
                    or discrepancies in the information provided.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Sidebar (30%) */}
          <div className="lg:w-[400px] lg:sticky lg:top-8 lg:h-fit space-y-6">
            {/* Expression of Interest Form */}
            <div className="bg-gray-900 rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-white mb-6">Expression of Interest</h3>
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Name *</label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] text-sm"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Contact Number *</label>
                  <input
                    type="tel"
                    required
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] text-sm"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Email *</label>
                  <input
                    type="email"
                    required
                    value={enquiryForm.email}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] text-sm"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">KYC Document</label>
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById('kyc-upload').click()}
                    className="w-full px-4 py-6 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl text-center cursor-pointer hover:border-[#dc2626] transition-colors"
                  >
                    <input
                      id="kyc-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {kycFile ? (
                      <div className="text-[#dc2626]">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium">{kycFile.name}</p>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm">Drag & drop or click to upload</p>
                        <p className="text-xs mt-1">PDF only</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Message</label>
                  <textarea
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] text-sm resize-none"
                    placeholder="Enter your message..."
                  />
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#dc2626] focus:ring-[#dc2626]"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-400 leading-tight">
                    I agree to the <span className="text-[#dc2626]">Terms & Conditions</span> and <span className="text-[#dc2626]">Privacy Policy</span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={enquiryMutation.isLoading || !acceptedTerms}
                  className="w-full px-6 py-3 bg-[#dc2626] text-white rounded-xl hover:bg-[#b91c1c] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enquiryMutation.isLoading ? 'Submitting...' : 'Submit'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-3">Or contact us directly:</p>
                <button
                  onClick={handleWhatsAppContact}
                  className="w-full px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .96 4.534.96 10.08c0 1.752.413 3.4 1.141 4.865L.06 23.884l9.251-2.39a11.717 11.717 0 005.739 1.49h.005c6.554 0 11.09-5.533 11.09-11.088a11.106 11.106 0 00-3.291-7.918"/>
                  </svg>
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Buying Process Timeline */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Buying Process</h3>
              <div className="space-y-4">
                {buyingProcessSteps.map((step, index) => (
                  <div key={step.number} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{step.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      index < 2 ? 'bg-green-50' : 'bg-gray-50'
                    }`}>
                      <svg className={`w-4 h-4 ${index < 2 ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <button
          onClick={() => {
            const formElement = document.querySelector('.bg-gray-900');
            if (formElement) {
              formElement.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="w-full px-6 py-3 bg-[#dc2626] text-white rounded-xl hover:bg-[#b91c1c] transition font-semibold"
        >
          Submit Expression of Interest
        </button>
      </div>
    </div>
  );
}

export default PropertyDetail;
