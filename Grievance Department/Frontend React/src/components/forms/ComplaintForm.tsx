import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Send, Upload, MapPin, FileText, Folder, Tag } from 'lucide-react';
import { ComplaintFormData } from '../../types';
import { ComplaintService } from '../../services/complaints';

const schema = yup.object({
  category: yup.string().required('Category is required'),
  subCategory: yup.string().required('Sub category is required'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  address: yup.string().required('Address is required'),
  landmark: yup.string(),
  pincode: yup.string().required('Pincode is required').matches(/^\d{6}$/, 'Pincode must be 6 digits'),
});

interface ComplaintFormProps {
  onSuccess: (complaintId: string) => void;
}

const fallbackCategories = {
  'water-supply': ['No Water Supply', 'Low Pressure', 'Water Quality Issue', 'Pipe Leakage'],
  'electricity': ['Power Cut', 'Voltage Fluctuation', 'Transformer Issue', 'Meter Problem'],
  'sanitation': ['Garbage Not Collected', 'Drainage Blockage', 'Public Toilet Issue'],
  'road': ['Potholes', 'Road Damage', 'Street Light Issue'],
  'waste-management': ['Illegal Dumping', 'Waste Processing Issue'],
  'other': ['Other Issues'],
};

export function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const [categories, setCategories] = useState<Record<string, string[]>>(fallbackCategories);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ComplaintFormData>({
    resolver: yupResolver(schema),
  });

  const selectedCategory = watch('category');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory && categories[selectedCategory]) {
      setSubCategories(categories[selectedCategory]);
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory, categories]);

  const loadCategories = async () => {
    try {
      const response = await ComplaintService.getCategories();
      if (response.success && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Keep fallback categories
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: 'Image file size should be less than 5MB', type: 'error' });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const onSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true);
    setMessage({ text: 'Processing your complaint...', type: 'loading' });

    try {
      const formData = new FormData();
      formData.append('category', data.category);
      formData.append('subCategory', data.subCategory);
      formData.append('description', data.description);
      formData.append('location', JSON.stringify({
        address: data.address,
        landmark: data.landmark || '',
        pincode: data.pincode,
      }));

      if (data.imageProof?.[0]) {
        formData.append('imageProof', data.imageProof[0]);
      }

      const response = await ComplaintService.fileComplaint(formData);
      
      if (response.success) {
        setMessage({
          text: `Complaint filed successfully! Complaint ID: ${response.data.complaint.complaintId}`,
          type: 'success',
        });
        reset();
        setImagePreview(null);
        onSuccess(response.data.complaint.complaintId);
      } else {
        setMessage({
          text: response.message || 'Failed to file complaint',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error filing complaint:', error);
      setMessage({
        text: 'Network error. Please check your connection and try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const formatCategoryName = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8" />
            File New Complaint
          </h2>
          <p className="text-blue-100 mt-2">Please provide detailed information about your grievance</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          {/* Category and Sub Category */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Folder className="w-4 h-4" />
                Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                <option value="">Select Category</option>
                {Object.keys(categories).map((category) => (
                  <option key={category} value={category}>
                    {formatCategoryName(category)}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-2">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Tag className="w-4 h-4" />
                Sub Category *
              </label>
              <select
                {...register('subCategory')}
                disabled={!selectedCategory}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select Sub Category</option>
                {subCategories.map((subCategory) => (
                  <option key={subCategory} value={subCategory}>
                    {subCategory}
                  </option>
                ))}
              </select>
              {errors.subCategory && (
                <p className="text-red-500 text-sm mt-2">{errors.subCategory.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <FileText className="w-4 h-4" />
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Please describe your issue in detail..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-vertical"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-2">{errors.description.message}</p>
            )}
          </div>

          {/* Location Details */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <MapPin className="w-4 h-4" />
              Location Details
            </label>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Address *
                </label>
                <input
                  {...register('address')}
                  type="text"
                  placeholder="Street address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-2">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Pincode *
                </label>
                <input
                  {...register('pincode')}
                  type="text"
                  placeholder="Area pincode"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
                {errors.pincode && (
                  <p className="text-red-500 text-sm mt-2">{errors.pincode.message}</p>
                )}
              </div>

              <div className="md:col-span-3">
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Landmark (Optional)
                </label>
                <input
                  {...register('landmark')}
                  type="text"
                  placeholder="Nearby landmark"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Upload className="w-4 h-4" />
              Image Proof (Optional)
            </label>
            <div className="space-y-4">
              <input
                {...register('imageProof')}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-sm rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg border-l-4 ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-400 text-green-800'
                : message.type === 'error'
                ? 'bg-red-50 border-red-400 text-red-800'
                : 'bg-blue-50 border-blue-400 text-blue-800'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'loading' && (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center gap-3 shadow-lg"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}