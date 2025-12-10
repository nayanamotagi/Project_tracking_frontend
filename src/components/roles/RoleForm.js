import React, { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import roleService from '../../services/roleService';

const RoleForm = ({
  mode = 'create', // 'create', 'edit', 'view'
  role = null,
  onSubmit,
  onCancel,
  isVisible = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    isActive: true
  });

  const [availablePermissions, setAvailablePermissions] = useState({});
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAvailablePermissions(roleService.getAvailablePermissions());
  }, []);

  useEffect(() => {
    if (role && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: role.name || '',
        displayName: role.displayName || '',
        description: role.description || '',
        permissions: role.permissions || [],
        isActive: role.isActive !== false
      });
    } else if (mode === 'create') {
      resetForm();
    }
  }, [role, mode]);

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: [],
      isActive: true
    });
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'view') return;

    setIsSubmitting(true);
    setErrors([]);

    try {
      // Validate form data
      const validation = roleService.validateRoleData(formData);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      // Submit the form
      await onSubmit(formData);
      
      if (mode === 'create') {
        resetForm();
      }
    } catch (error) {
      setErrors([error.message || 'Failed to save role']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (permission) => {
    if (mode === 'view') return;

    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const toggleCategoryPermissions = (categoryPermissions) => {
    if (mode === 'view') return;

    const allSelected = categoryPermissions.every(perm => 
      formData.permissions.includes(perm.key)
    );
    
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !categoryPermissions.some(cp => cp.key === p))
        : [...new Set([...prev.permissions, ...categoryPermissions.map(cp => cp.key)])]
    }));
  };

  const handleInputChange = (field, value) => {
    if (mode === 'view') return;

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Create Role' : 
             mode === 'edit' ? 'Edit Role' : 'Role Details'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-700">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {mode === 'view' ? (
          <RoleViewContent 
            role={role} 
            availablePermissions={availablePermissions}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <RoleBasicInfo 
              formData={formData}
              onChange={handleInputChange}
              disabled={mode === 'view'}
            />
            
            <RolePermissionsSection
              formData={formData}
              availablePermissions={availablePermissions}
              onTogglePermission={togglePermission}
              onToggleCategoryPermissions={toggleCategoryPermissions}
              disabled={mode === 'view'}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create' : 'Update')} Role
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Sub-component for basic role information
const RoleBasicInfo = ({ formData, onChange, disabled }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Display Name *
      </label>
      <input
        type="text"
        required
        disabled={disabled}
        value={formData.displayName}
        onChange={(e) => onChange('displayName', e.target.value)}
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">
        System Name *
      </label>
      <input
        type="text"
        required
        disabled={disabled}
        value={formData.name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="e.g., custom_role"
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>

    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700">
        Description *
      </label>
      <textarea
        required
        rows={3}
        disabled={disabled}
        value={formData.description}
        onChange={(e) => onChange('description', e.target.value)}
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>

    <div className="sm:col-span-2">
      <label className="flex items-center">
        <input
          type="checkbox"
          disabled={disabled}
          checked={formData.isActive}
          onChange={(e) => onChange('isActive', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:cursor-not-allowed"
        />
        <span className="ml-2 text-sm text-gray-700">Active Role</span>
      </label>
    </div>
  </div>
);

// Sub-component for role permissions
const RolePermissionsSection = ({ 
  formData, 
  availablePermissions, 
  onTogglePermission, 
  onToggleCategoryPermissions, 
  disabled 
}) => (
  <div>
    <h4 className="text-lg font-medium text-gray-900 mb-3">Permissions</h4>
    <div className="space-y-4">
      {Object.entries(availablePermissions).map(([category, perms]) => (
        <div key={category} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-gray-900">{category}</h5>
            {!disabled && (
              <button
                type="button"
                onClick={() => onToggleCategoryPermissions(perms)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {perms.every(p => formData.permissions.includes(p.key)) 
                  ? 'Deselect All' 
                  : 'Select All'
                }
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {perms.map((perm) => (
              <label key={perm.key} className="flex items-center">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={formData.permissions.includes(perm.key)}
                  onChange={() => onTogglePermission(perm.key)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:cursor-not-allowed"
                />
                <span className="ml-2 text-sm text-gray-700">{perm.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Sub-component for viewing role details
const RoleViewContent = ({ role, availablePermissions }) => (
  <div className="space-y-6">
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-lg font-medium text-gray-900 mb-3">Role Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="text-sm font-medium text-gray-500">Display Name:</span>
          <p className="text-gray-900">{role?.displayName}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500">System Name:</span>
          <p className="text-gray-900">{role?.name}</p>
        </div>
        <div className="md:col-span-2">
          <span className="text-sm font-medium text-gray-500">Description:</span>
          <p className="text-gray-900">{role?.description}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500">Status:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            role?.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {role?.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500">Type:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            role?.isSystem 
              ? 'bg-gray-100 text-gray-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {role?.isSystem ? 'System Role' : 'Custom Role'}
          </span>
        </div>
      </div>
    </div>

    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-3">Permissions</h4>
      <div className="space-y-4">
        {Object.entries(availablePermissions).map(([category, perms]) => {
          const categoryPerms = perms.filter(p => role?.permissions?.includes(p.key));
          if (categoryPerms.length === 0) return null;
          
          return (
            <div key={category} className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">{category}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {categoryPerms.map((perm) => (
                  <div key={perm.key} className="flex items-center">
                    <FiCheck className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">{perm.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default RoleForm; 