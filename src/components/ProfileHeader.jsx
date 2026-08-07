import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateUserProfile } from '../utils/Redux/userSlice';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { notify } from '../utils/notificationUtils';
import { describeFirestoreError } from '../utils/firestoreErrors';
import { FiEdit2, FiX, FiPhone, FiMapPin, FiMail, FiCheck, FiShoppingBag } from 'react-icons/fi';
import Avatar from './Avatar';
import Button from './Button';

const FIELD_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 transition-all duration-150 focus:border-transparent focus:ring-2 focus:ring-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-yellow-500';

const InfoRow = ({ icon: Icon, iconWrapper, label, value }) => (
  <div className="flex items-start gap-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700">
    <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconWrapper}`}>
      <Icon size={18} aria-hidden="true" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-0.5 break-words font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const ProfileHeader = ({ user, isEditing, setIsEditing, orderCount = 0, orderCountKnown = true }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Re-sync the form when the underlying user changes (e.g. the auth listener
  // resolves the Firestore profile after the first paint).
  useEffect(() => {
    if (isEditing) return;
    setFormData({
      displayName: user?.displayName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
    });
  }, [user, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};

    if (!formData.displayName.trim()) {
      next.displayName = 'Please enter your name';
    }
    if (!formData.phoneNumber.trim()) {
      next.phoneNumber = 'Please enter a phone number';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      next.phoneNumber = 'Please enter a valid phone number';
    }
    if (!formData.address.trim()) {
      next.address = 'Please enter a delivery address';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault?.();

    // Inline, per-field errors instead of a single "Please fill all fields"
    // toast that didn't say which field was the problem.
    if (!validate()) return;

    const payload = {
      displayName: formData.displayName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      address: formData.address.trim(),
    };

    try {
      setSaving(true);
      // setDoc(..., { merge: true }) rather than updateDoc: updateDoc rejects
      // with not-found when the users/{uid} document doesn't exist yet, which is
      // the case for any account that was created in Firebase Auth without a
      // matching profile document.
      await setDoc(doc(db, 'users', user.uid), payload, { merge: true });

      dispatch(updateUserProfile(payload));
      notify.success('Profile updated');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      const { message } = describeFirestoreError(error, 'your profile');
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user?.displayName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSaveProfile} noValidate className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              aria-invalid={!!errors.displayName}
              aria-describedby={errors.displayName ? 'profile-name-error' : undefined}
              className={`${FIELD_CLASSES} ${errors.displayName ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
              placeholder="Enter your full name"
            />
            {errors.displayName && (
              <p id="profile-name-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.displayName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="profile-email" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              name="email"
              value={formData.email}
              disabled
              aria-describedby="profile-email-hint"
              className="w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 px-4 py-2.5 text-gray-600 dark:text-gray-400"
            />
            <p id="profile-email-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label htmlFor="profile-phone" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              id="profile-phone"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              aria-invalid={!!errors.phoneNumber}
              aria-describedby={errors.phoneNumber ? 'profile-phone-error' : undefined}
              className={`${FIELD_CLASSES} ${errors.phoneNumber ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
              placeholder="+91 XXXXXXXXXX"
            />
            {errors.phoneNumber && (
              <p id="profile-phone-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.phoneNumber}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="profile-address" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Delivery Address
            </label>
            <textarea
              id="profile-address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              maxLength="500"
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? 'profile-address-error' : undefined}
              className={`${FIELD_CLASSES} resize-none ${errors.address ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
              placeholder="House / street / area, city, PIN"
            />
            {errors.address && (
              <p id="profile-address-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.address}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 dark:border-gray-700 pt-5 sm:flex-row">
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={saving}
            aria-busy={saving}
          >
            <FiCheck size={18} aria-hidden="true" />
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={handleCancel}
            disabled={saving}
          >
            <FiX size={18} aria-hidden="true" />
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
      <div className="flex flex-shrink-0 flex-col items-center gap-4 sm:items-start">
        <Avatar user={user} size="xl" rounded="rounded-2xl" />
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => setIsEditing(true)}
        >
          <FiEdit2 size={15} aria-hidden="true" />
          Edit Profile
        </Button>
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
          {user?.displayName || 'Your account'}
        </h1>

        <div className="mt-5 space-y-3">
          <InfoRow
            icon={FiMail}
            iconWrapper="bg-blue-100 text-blue-600"
            label="Email address"
            value={user?.email || '—'}
          />
          <InfoRow
            icon={FiPhone}
            iconWrapper="bg-emerald-100 text-emerald-600"
            label="Phone number"
            value={user?.phoneNumber || 'Not added yet'}
          />
          <InfoRow
            icon={FiMapPin}
            iconWrapper="bg-orange-100 text-orange-600"
            label="Delivery address"
            value={user?.address || 'Not added yet'}
          />
        </div>

        {/*
          Only real data here. The previous version showed a hardcoded
          "Premium Member" badge, a fabricated "⭐ 4.8" rating and an "Active"
          tile — none of which were derived from anything.
        */}
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-5">
          <div className="inline-flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 dark:bg-yellow-500 text-white dark:text-gray-900">
              <FiShoppingBag size={18} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {orderCountKnown ? orderCount : '—'}
              </span>
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {orderCount === 1 ? 'Order placed' : 'Orders placed'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
