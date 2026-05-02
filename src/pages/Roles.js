import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  canManageRoles,
  canCreateRole,
  canUpdateRole,
  canDeleteRole,
  canAssignRoles
} from '../utils/permissions';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiShield,
  FiUsers,
  FiFilter,
  FiSearch,
  FiCheck,
  FiX,
  FiUser
} from 'react-icons/fi';

// Import Role model
import { Role, RoleFactory, RoleUtils } from '../models/Role';

const Roles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUserAssignModal, setShowUserAssignModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view
  const [selectedRole, setSelectedRole] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    hasUsers: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    isActive: true
  });

  // Available permissions grouped by category
  const availablePermissions = RoleUtils.getPermissionCategories();

  const filterRoles = useCallback(() => {
    const filtered = RoleUtils.filterRoles(roles, filters);
    setFilteredRoles(filtered);
  }, [roles, filters]);

  useEffect(() => {
    if (canManageRoles(user)) {
      fetchRoles();
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    filterRoles();
  }, [filterRoles]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // Create system roles using the Role model
      const systemRoles = RoleFactory.getSystemRoles();
      
      // Add some mock user counts for demo
      systemRoles[0].userCount = 2;  // Admin
      systemRoles[1].userCount = 5;  // Project Manager 
      systemRoles[2].userCount = 15; // Employee
      
      // Get custom roles from localStorage
      const customRolesData = JSON.parse(localStorage.getItem('customRoles') || '[]');
      const customRoles = customRolesData.map(data => Role.fromAPI(data));
      
      const allRoles = [...systemRoles, ...customRoles];
      setRoles(allRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        // Create new role using Role model
        const newRole = RoleFactory.createCustomRole(formData);
        const validation = newRole.validate();
        
        if (!validation.isValid) {
          toast.error(validation.errors[0]);
          return;
        }

        // Check name uniqueness
        if (!RoleUtils.isRoleNameUnique(newRole.name, roles)) {
          toast.error('Role with this name already exists');
          return;
        }

        // Save to localStorage for demo
        const customRoles = JSON.parse(localStorage.getItem('customRoles') || '[]');
        customRoles.push({
          ...newRole.toJSON(),
          id: Date.now().toString(),
          _id: Date.now().toString()
        });
        localStorage.setItem('customRoles', JSON.stringify(customRoles));
        
        toast.success('Role created successfully');
      } else {
        // Update existing role
        const updatedRole = selectedRole.clone();
        updatedRole.update(formData);
        
        const validation = updatedRole.validate();
        if (!validation.isValid) {
          toast.error(validation.errors[0]);
          return;
        }

        // Update in localStorage for demo
        const customRoles = JSON.parse(localStorage.getItem('customRoles') || '[]');
        const index = customRoles.findIndex(r => r.id === selectedRole.id);
        if (index !== -1) {
          customRoles[index] = updatedRole.toJSON();
          localStorage.setItem('customRoles', JSON.stringify(customRoles));
        }
        
        toast.success('Role updated successfully');
      }

      setShowModal(false);
      fetchRoles();
      resetForm();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Failed to save role');
    }
  };

  const handleDelete = async (roleId) => {
    const role = roles.find(r => r.id === roleId);
    
    if (!role) return;

    if (!role.canBeDeleted()) {
      if (role.isSystem) {
        toast.error('System roles cannot be deleted');
      } else {
        toast.error('Cannot delete role that is assigned to users');
      }
      return;
    }

    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        // Remove from localStorage for demo
        const customRoles = JSON.parse(localStorage.getItem('customRoles') || '[]');
        const filteredRoles = customRoles.filter(r => r.id !== roleId);
        localStorage.setItem('customRoles', JSON.stringify(filteredRoles));
        
        toast.success('Role deleted successfully');
        fetchRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
        toast.error('Failed to delete role');
      }
    }
  };

  const handleUserRoleAssignment = async (userId, newRole) => {
    try {
      // In a real app, this would be: await axios.put(`/api/users/${userId}/role`, { role: newRole });
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: newRole }
          : user
      ));
      toast.success('User role updated successfully');
      setShowUserAssignModal(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const getStatusBadge = (role) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        role.isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {role.getStatus().toUpperCase()}
      </span>
    );
  };

  const openModal = (mode, role = null) => {
    setModalMode(mode);
    setSelectedRole(role);
    
    if (mode === 'create') {
      resetForm();
    } else if (role) {
      setFormData({
        name: role.name || '',
        displayName: role.displayName || '',
        description: role.description || '',
        permissions: role.permissions || [],
        isActive: role.isActive !== false
      });
    }
    
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: [],
      isActive: true
    });
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const toggleCategoryPermissions = (categoryPermissions) => {
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

  const userCanManage = canManageRoles(user);
  const userCanCreate = canCreateRole(user);
  const userCanUpdate = canUpdateRole(user);
  const userCanDelete = canDeleteRole(user);
  const userCanAssign = canAssignRoles(user);

  if (!userCanManage) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <FiShield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to manage roles.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600">Manage system roles and their permissions</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {userCanAssign && (
            <button
              onClick={() => setShowUserAssignModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiUser className="mr-2 h-4 w-4" />
              Assign Roles
            </button>
          )}
          {userCanCreate && (
            <button
              onClick={() => openModal('create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              New Role
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search roles..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Assignment
            </label>
            <select
              value={filters.hasUsers}
              onChange={(e) => setFilters({ ...filters, hasUsers: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Roles</option>
              <option value="with_users">With Users</option>
              <option value="without_users">Without Users</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', hasUsers: '' })}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiFilter className="mr-2 h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRoles.map((role) => (
          <div key={role.id || role._id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiShield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {role.displayName}
                    </h3>
                    <p className="text-sm text-gray-500">{role.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal('view', role)}
                    className="text-gray-400 hover:text-gray-600"
                    title="View details"
                  >
                    <FiEye className="h-4 w-4" />
                  </button>
                  {userCanUpdate && role.canBeModified() && (
                    <button
                      onClick={() => openModal('edit', role)}
                      className="text-blue-400 hover:text-blue-600"
                      title="Edit role"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                  )}
                  {userCanDelete && role.canBeDeleted() && (
                    <button
                      onClick={() => handleDelete(role.id || role._id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete role"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {role.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {getStatusBadge(role)}
                  
                  {role.isSystem && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {role.getType().toUpperCase()} Role
                    </span>
                  )}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <FiUsers className="mr-2 h-4 w-4" />
                  {role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned
                </div>

                <div className="text-sm text-gray-500">
                  <span className="font-medium">{role.permissions.length}</span> permissions
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <FiShield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {roles.length === 0 
              ? "Get started by creating a new role." 
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      )}

      {/* Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalMode === 'create' ? 'Create Role' : 
                 modalMode === 'edit' ? 'Edit Role' : 'Role Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {modalMode === 'view' ? (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Role Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Display Name:</span>
                      <p className="text-gray-900">{selectedRole?.displayName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">System Name:</span>
                      <p className="text-gray-900">{selectedRole?.name}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-gray-500">Description:</span>
                      <p className="text-gray-900">{selectedRole?.description}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Permissions</h4>
                  <div className="space-y-4">
                    {Object.entries(availablePermissions).map(([category, perms]) => {
                      const categoryPerms = perms.filter(p => selectedRole?.permissions.includes(p.key));
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
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      System Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., custom_role"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Permissions</h4>
                  <div className="space-y-4">
                    {Object.entries(availablePermissions).map(([category, perms]) => (
                      <div key={category} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">{category}</h5>
                          <button
                            type="button"
                            onClick={() => toggleCategoryPermissions(perms)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {perms.every(p => formData.permissions.includes(p.key)) 
                              ? 'Deselect All' 
                              : 'Select All'
                            }
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {perms.map((perm) => (
                            <label key={perm.key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm.key)}
                                onChange={() => togglePermission(perm.key)}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-700">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {modalMode === 'create' ? 'Create' : 'Update'} Role
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* User Role Assignment Modal */}
      {showUserAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign User Roles</h3>
              <button
                onClick={() => setShowUserAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">Current: {user.role}</p>
                  </div>
                  <div>
                    <select
                      value={user.role}
                      onChange={(e) => handleUserRoleAssignment(user._id, e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {roles.filter(role => role.isActive).map((role) => (
                        <option key={role._id} value={role.name}>
                          {role.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {users.length === 0 && (
              <div className="text-center py-8">
                <FiUser className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No users available for role assignment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles; 