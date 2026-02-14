import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

function Profile() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setFormData({
      full_name: user.full_name || '',
      phone: user.phone || ''
    });
    setPreviewUrl(user.profile_photo || null);
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/user/profile', formData);
      await fetchUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!profilePhoto) {
      toast.error('Please select a photo');
      return;
    }

    setLoading(true);

    try {
      const formDataWithFile = new FormData();
      formDataWithFile.append('photo', profilePhoto);

      await api.post('/user/upload-photo', formDataWithFile, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      await fetchUser();
      setProfilePhoto(null);
      toast.success('Profile photo uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete your profile photo?')) return;

    setLoading(true);

    try {
      await api.delete('/user/photo');
      await fetchUser();
      setPreviewUrl(null);
      toast.success('Profile photo deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="mt-2 text-gray-600">Update your personal information</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Profile Photo Section */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
            
            <div className="flex items-center space-x-6">
              {/* Current Photo */}
              <div className="flex-shrink-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={user?.full_name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload Form */}
              <div className="flex-1">
                <form onSubmit={handleUploadPhoto} className="space-y-3">
                  <input
                    type="file"
                    id="photo"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <label htmlFor="photo" className="block">
                    <button
                      type="button"
                      onClick={() => document.getElementById('photo').click()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Change Photo
                    </button>
                  </label>

                  {profilePhoto && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Uploading...' : 'Upload'}
                    </button>
                  )}

                  {user?.profile_photo && (
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      disabled={loading}
                      className="block text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete Photo
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Profile Information Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <a
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
