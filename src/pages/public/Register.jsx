import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    emailId: '',
    address: '',
    requirements: [
      {
        preferredCity: '',
        budget: '',
        propertyType: '',
        requirementType: 'immediate'
      }
    ]
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeRequirementTab, setActiveRequirementTab] = useState(0);

  const validateForm = () => {
    const newErrors = {};
    
    // Basic Details Validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber.replace(/\s/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid 10-digit contact number';
    }
    
    if (!formData.emailId.trim()) {
      newErrors.emailId = 'Email ID is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      newErrors.emailId = 'Please enter a valid email address';
    }

    // Requirements Validation
    formData.requirements.forEach((req, index) => {
      if (!req.preferredCity.trim()) {
        newErrors[`preferredCity_${index}`] = 'Preferred city is required';
      }
      if (!req.budget) {
        newErrors[`budget_${index}`] = 'Budget is required';
      }
      if (!req.propertyType) {
        newErrors[`propertyType_${index}`] = 'Property type is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRequirementChange = (index, field, value) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = {
      ...newRequirements[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      requirements: newRequirements
    }));
    
    // Clear error when user starts typing
    const errorKey = `${field}_${index}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        {
          preferredCity: '',
          budget: '',
          propertyType: '',
          requirementType: 'immediate'
        }
      ]
    }));
    setActiveRequirementTab(formData.requirements.length);
  };

  const removeRequirement = (index) => {
    if (formData.requirements.length > 1) {
      const newRequirements = formData.requirements.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        requirements: newRequirements
      }));
      if (activeRequirementTab >= newRequirements.length) {
        setActiveRequirementTab(newRequirements.length - 1);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!acceptedTerms) {
      setErrors({ submit: 'Please accept the Terms & Conditions and Privacy Policy to continue.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Replace with actual API call
      console.log('Registration data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message and redirect
      alert('Registration successful! We will contact you soon.');
      navigate('/');
      
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const budgetOptions = [
    'Under 20 Lakhs',
    '20-40 Lakhs',
    '40-60 Lakhs',
    '60 Lakhs - 1 Crore',
    '1-2 Crores',
    '2-5 Crores',
    'Above 5 Crores'
  ];

  const propertyTypeOptions = [
    'Residential Apartment',
    'Independent House',
    'Villa',
    'Plot/Land',
    'Commercial Office',
    'Retail Shop',
    'Warehouse',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Dream<span className="text-red-600">Bid</span></span>
            </Link>
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Forms (75%) */}
          <div className="flex-1 space-y-8">
            {/* Basic Details Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Basic Details</h2>
                <p className="text-sm text-gray-500">Fields marked with * are mandatory.</p>
              </div>

              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800">{errors.submit}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.contactNumber ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Enter your 10-digit mobile number"
                  />
                  {errors.contactNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.contactNumber}</p>
                  )}
                </div>

                {/* Email ID */}
                <div>
                  <label htmlFor="emailId" className="block text-sm font-medium text-gray-700 mb-2">
                    Email ID <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="emailId"
                    name="emailId"
                    value={formData.emailId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.emailId ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {errors.emailId && (
                    <p className="mt-1 text-xs text-red-600">{errors.emailId}</p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    placeholder="Enter your address (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Requirement Details Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Requirement Details</h2>
                <p className="text-sm text-gray-500">Fields marked with * are mandatory.</p>
              </div>

              {/* Requirement Tabs */}
              <div className="mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {formData.requirements.map((req, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveRequirementTab(index)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeRequirementTab === index
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Requirement {index + 1}
                      {formData.requirements.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRequirement(index);
                          }}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={addRequirement}
                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200"
                  >
                    + Add Requirement
                  </button>
                </div>
              </div>

              {/* Requirement Form */}
              {formData.requirements.map((requirement, index) => (
                <div
                  key={index}
                  className={`${activeRequirementTab === index ? 'block' : 'hidden'}`}
                >
                  <div className="space-y-6">
                    {/* Preferred City / Locality */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred City / Locality <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={requirement.preferredCity}
                        onChange={(e) => handleRequirementChange(index, 'preferredCity', e.target.value)}
                        className={`w-full px-4 py-3 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          errors[`preferredCity_${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        }`}
                        placeholder="Enter preferred city or locality"
                      />
                      {errors[`preferredCity_${index}`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`preferredCity_${index}`]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Budget */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Budget <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={requirement.budget}
                          onChange={(e) => handleRequirementChange(index, 'budget', e.target.value)}
                          className={`w-full px-4 py-3 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            errors[`budget_${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select Budget</option>
                          {budgetOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {errors[`budget_${index}`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`budget_${index}`]}</p>
                        )}
                      </div>

                      {/* Property Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Property Type <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={requirement.propertyType}
                          onChange={(e) => handleRequirementChange(index, 'propertyType', e.target.value)}
                          className={`w-full px-4 py-3 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            errors[`propertyType_${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select Property Type</option>
                          {propertyTypeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {errors[`propertyType_${index}`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`propertyType_${index}`]}</p>
                        )}
                      </div>
                    </div>

                    {/* Requirement Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Requirement Type <span className="text-red-600">*</span>
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`requirementType_${index}`}
                            value="immediate"
                            checked={requirement.requirementType === 'immediate'}
                            onChange={(e) => handleRequirementChange(index, 'requirementType', e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Immediate</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`requirementType_${index}`}
                            value="future"
                            checked={requirement.requirementType === 'future'}
                            onChange={(e) => handleRequirementChange(index, 'requirementType', e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Future</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Action Panel (25%) */}
          <div className="lg:w-[320px] lg:sticky lg:top-8 lg:h-fit">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-6">
                {/* Terms & Conditions */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 leading-tight">
                    By continuing, you accept the <span className="text-blue-600 font-medium">Terms & Conditions</span> and <span className="text-blue-600 font-medium">Privacy Policy</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !acceptedTerms}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit'
                    )}
                  </button>
                  
                  <button
                    onClick={() => navigate('/')}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>

                {/* Info Section */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1 text-sm">What happens next?</h3>
                      <p className="text-gray-600 text-xs leading-relaxed">
                        Once you submit your requirements, our team will review your information and contact you within 24-48 hours to discuss your property needs in detail.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <div className="flex items-start gap-3 mb-3">
          <input
            type="checkbox"
            id="terms-mobile"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="terms-mobile" className="text-sm text-gray-600 leading-tight">
            By continuing, you accept the <span className="text-blue-600 font-medium">Terms & Conditions</span> and <span className="text-blue-600 font-medium">Privacy Policy</span>
          </label>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !acceptedTerms}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </div>
          ) : (
            'Submit Registration'
          )}
        </button>
      </div>
    </div>
  );
}

export default Register;
