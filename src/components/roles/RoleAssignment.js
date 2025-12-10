import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiSearch, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const RoleAssignment = ({
  isVisible = false,
  onClose,
  roles = [],
  onUserRoleUpdate
}) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      fetchUsers();
    }
  }, [isVisible]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.employeeId?.toLowerCase().includes(term)
      );
    }

    // Filter by role
    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const handleSingleUserRoleUpdate = async (userId, newRole) => {
    try {
      setUpdating(true);
      
      // In a real app, this would be: await axios.put(`/api/users/${userId}/role`, { role: newRole });
      // For now, just update the local state and call the callback
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: newRole }
          : user
      ));
      
      toast.success('User role updated successfully');
      
      if (onUserRoleUpdate) {
        onUserRoleUpdate(userId, newRole);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkRoleUpdate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to update');
      return;
    }

    if (!selectedRole) {
      toast.error('Please select a role to assign');
      return;
    }

    try {
      setUpdating(true);
      
      // In a real app, this would be a bulk update API call
      // For now, update each user individually
      for (const userId of selectedUsers) {
        await handleSingleUserRoleUpdate(userId, selectedRole);
      }
      
      toast.success(`Updated roles for ${selectedUsers.length} users`);
      
      // Reset bulk mode
      setBulkMode(false);
      setSelectedUsers([]);
      setSelectedRole('');
    } catch (error) {
      console.error('Error updating bulk user roles:', error);
      toast.error('Failed to update user roles');
    } finally {
      setUpdating(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id));
    }
  };

  const getRoleDisplayName = (roleName) => {
    const role = roles.find(r => r.name === roleName);
    return role ? role.displayName : roleName;
  };

  const getRoleColor = (roleName) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      project_manager: 'bg-blue-100 text-blue-800',
      employee: 'bg-green-100 text-green-800'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">User Role Assignment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Search and Filter */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Users
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Roles</option>
                {roles.filter(role => role.isActive).map((role) => (
                  <option key={role._id} value={role.name}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className={`w-full px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  bulkMode
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {bulkMode ? 'Cancel Bulk' : 'Bulk Update'}
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {bulkMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={selectAllUsers}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select Role</option>
                    {roles.filter(role => role.isActive).map((role) => (
                      <option key={role._id} value={role.name}>
                        {role.displayName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkRoleUpdate}
                    disabled={updating || selectedUsers.length === 0 || !selectedRole}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Updating...' : 'Update Roles'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <UserRoleItem
                key={user._id}
                user={user}
                roles={roles}
                onRoleUpdate={handleSingleUserRoleUpdate}
                getRoleDisplayName={getRoleDisplayName}
                getRoleColor={getRoleColor}
                updating={updating}
                bulkMode={bulkMode}
                isSelected={selectedUsers.includes(user._id)}
                onToggleSelection={toggleUserSelection}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <FiUser className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {users.length === 0 ? 'No users found' : 'No users match your search'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {users.length === 0 
                  ? 'No users available for role assignment.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual user role item
const UserRoleItem = ({
  user,
  roles,
  onRoleUpdate,
  getRoleDisplayName,
  getRoleColor,
  updating,
  bulkMode,
  isSelected,
  onToggleSelection
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (newRole) => {
    setIsUpdating(true);
    try {
      await onRoleUpdate(user._id, newRole);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
      bulkMode && isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        {bulkMode && (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(user._id)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </label>
        )}
        
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FiUser className="h-5 w-5 text-gray-600" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{user.name}</h4>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400">
            ID: {user.employeeId || user._id}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
            {getRoleDisplayName(user.role)}
          </span>
        </div>
        
        {!bulkMode && (
          <div className="min-w-0 flex-1">
            <select
              value={user.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={isUpdating || updating}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {roles.filter(role => role.isActive).map((role) => (
                <option key={role._id} value={role.name}>
                  {role.displayName}
                </option>
              ))}
            </select>
            {isUpdating && (
              <div className="mt-1 flex items-center">
                <div className="spinner-sm mr-2"></div>
                <span className="text-xs text-gray-500">Updating...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleAssignment; 