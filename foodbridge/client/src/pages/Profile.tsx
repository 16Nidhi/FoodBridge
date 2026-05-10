import React, { useState, useEffect, FormEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getMe as getUserProfile, updateUserProfile, submitVerification } from '../services/api';
import { setUser } from '../store/slices/authSlice';
import { User } from '../types';
import './Profile.css';

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: any) => state.auth.user as User);

  const [profile, setProfile] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [verificationData, setVerificationData] = useState({ idType: 'aadhar', idDocument: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser?._id) {
        setLoading(false);
        showToast('User not found. Please log in again.', 'error');
        return;
      }
      try {
        const res = await getUserProfile();
        const profileData = res.data?.user || res.data;
        setProfile(profileData);
        setFormData({ name: profileData.name, location: profileData.location || '' });
      } catch (error) {
        showToast('Failed to fetch profile data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser?._id]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
    const res = await updateUserProfile(formData);
    const updatedUser = res.data?.user || res.data;
    dispatch(setUser(updatedUser));
    setProfile(updatedUser);
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerificationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!verificationData.idDocument) {
      showToast('Please enter your ID document number.', 'error');
      return;
    }
    setSubmitting(true);
    try {
    const response = await submitVerification(verificationData.idDocument);
    const message = response.data?.message || 'Verification submitted for review!';
    showToast(message, 'success');
    // Refetch profile to update verification status
    const res = await getUserProfile();
    const profileData = res.data?.user || res.data;
    setProfile(profileData);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit verification.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div></div></div>;
  }

  if (!profile) {
    return <div className="error-msg">Could not load profile. Please try logging in again.</div>;
  }

  const VerificationStatus = () => {
    if (profile.role !== 'volunteer') return null;

    switch (profile.verificationStatus) {
      case 'approved':
        return <div className="status-badge status-verified"><i className="fas fa-check-circle"></i> Verified Volunteer</div>;
      case 'pending':
        return <div className="status-badge status-pending"><i className="fas fa-hourglass-half"></i> Verification Pending Review</div>;
      case 'rejected':
        return (
          <>
            <div className="status-badge status-rejected"><i className="fas fa-times-circle"></i> Verification Rejected</div>
            <p className="text-muted">Your previous submission was rejected. Please check your details and resubmit.</p>
          </>
        );
      default:
        return (
          <div className="db-card verification-form-container">
            <div className="db-card-body">
              <h3 className="db-card-title">Become a Verified Volunteer</h3>
              <p className="text-muted">Submit your ID for verification to start accepting pickups.</p>
              <form onSubmit={handleVerificationSubmit} className="auth-form" style={{marginTop: '1rem'}}>
                <div className="form-group">
                  <label htmlFor="idType">ID Type</label>
                  <select
                    id="idType"
                    className="db-select"
                    value={verificationData.idType}
                    onChange={(e) => setVerificationData({ ...verificationData, idType: e.target.value })}
                  >
                    <option value="aadhar">Aadhar Card</option>
                    <option value="student_id">Student ID</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="idDocument">ID Document Number</label>
                  <input
                    type="text"
                    id="idDocument"
                    value={verificationData.idDocument}
                    onChange={(e) => setVerificationData({ ...verificationData, idDocument: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="db-btn db-btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </form>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>My Profile</h1>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="btn btn-secondary"
          >
            <i className="fas fa-pencil-alt"></i> Edit Profile
          </button>
        )}
      </header>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Account Details</h2>
          </div>
          <div className="profile-card-body">
            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="profile-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> <span className="profile-role">{profile.role}</span></p>
                <p><strong>Location:</strong> {profile.location || 'Not set'}</p>
                <p><strong>Joined:</strong> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}</p>
              </div>
            )}
          </div>
        </div>

        {profile.role === 'volunteer' && (
          <div className="verification-card">
            <h2>Volunteer Verification</h2>
            <VerificationStatus />
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
