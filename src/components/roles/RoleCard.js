import React from 'react';
import {
  FiEye,
  FiEdit2,
  FiTrash2,
  FiShield,
  FiUsers
} from 'react-icons/fi';

const RoleCard = ({
  role,
  onView,
  onEdit,
  onDelete,
  canUpdate = false,
  canDelete = false
}) => {
  const handleDelete = () => {
    if (role?.isSystem) {
      return;
    }

    if (role?.userCount > 0) {
      return;
    }

    onDelete(role._id);
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
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
              onClick={() => onView(role)}
              className="text-gray-400 hover:text-gray-600"
              title="View details"
            >
              <FiEye className="h-4 w-4" />
            </button>
            {canUpdate && !role.isSystem && (
              <button
                onClick={() => onEdit(role)}
                className="text-blue-400 hover:text-blue-600"
                title="Edit role"
              >
                <FiEdit2 className="h-4 w-4" />
              </button>
            )}
            {canDelete && !role.isSystem && role.userCount === 0 && (
              <button
                onClick={handleDelete}
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              role.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {role.isActive ? 'Active' : 'Inactive'}
            </span>
            
            {role.isSystem && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                System Role
              </span>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <FiUsers className="mr-2 h-4 w-4" />
            {role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned
          </div>

          <div className="text-sm text-gray-500">
            <span className="font-medium">{role.permissions?.length || 0}</span> permissions
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleCard; 