import axios from 'axios';
import { PERMISSIONS } from '../utils/permissions';

/**
 * Role Service - Handles all role-related API operations
 */
class RoleService {
  constructor() {
    this.mockRoles = [
      {
        _id: '1',
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access with all permissions',
        permissions: Object.values(PERMISSIONS).flatMap(category => Object.values(category)),
        userCount: 2,
        isActive: true,
        isSystem: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        _id: '2',
        name: 'project_manager',
        displayName: 'Project Manager',
        description: 'Can manage projects and teams but cannot delete projects',
        permissions: [
          PERMISSIONS.PROJECTS.VIEW_ALL,
          PERMISSIONS.PROJECTS.CREATE,
          PERMISSIONS.PROJECTS.UPDATE,
          PERMISSIONS.TASKS.VIEW_ALL,
          PERMISSIONS.TASKS.CREATE,
          PERMISSIONS.TASKS.UPDATE_ALL,
          PERMISSIONS.TASKS.DELETE,
          PERMISSIONS.EMPLOYEES.VIEW_BASIC,
          PERMISSIONS.USERS.VIEW_TEAM,
          PERMISSIONS.NAVIGATION.DASHBOARD,
          PERMISSIONS.NAVIGATION.PROJECTS,
          PERMISSIONS.NAVIGATION.TASKS,
          PERMISSIONS.NAVIGATION.EMPLOYEES,
          PERMISSIONS.NAVIGATION.PROFILE,
          PERMISSIONS.NAVIGATION.REPORTS
        ],
        userCount: 5,
        isActive: true,
        isSystem: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        _id: '3',
        name: 'employee',
        displayName: 'Employee',
        description: 'Basic access to assigned work and team information',
        permissions: [
          PERMISSIONS.PROJECTS.VIEW_ASSIGNED,
          PERMISSIONS.TASKS.VIEW_ASSIGNED,
          PERMISSIONS.TASKS.UPDATE_OWN,
          PERMISSIONS.EMPLOYEES.VIEW_BASIC,
          PERMISSIONS.USERS.VIEW_TEAM,
          PERMISSIONS.NAVIGATION.DASHBOARD,
          PERMISSIONS.NAVIGATION.PROJECTS,
          PERMISSIONS.NAVIGATION.TASKS,
          PERMISSIONS.NAVIGATION.EMPLOYEES,
          PERMISSIONS.NAVIGATION.PROFILE
        ],
        userCount: 15,
        isActive: true,
        isSystem: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    // Use localStorage to persist custom roles
    this.customRoles = this.getCustomRolesFromStorage();
  }

  /**
   * Get custom roles from localStorage
   */
  getCustomRolesFromStorage() {
    try {
      const stored = localStorage.getItem('customRoles');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading custom roles from storage:', error);
      return [];
    }
  }

  /**
   * Save custom roles to localStorage
   */
  saveCustomRolesToStorage() {
    try {
      localStorage.setItem('customRoles', JSON.stringify(this.customRoles));
    } catch (error) {
      console.error('Error saving custom roles to storage:', error);
    }
  }

  /**
   * Get all roles (system + custom)
   */
  async getAllRoles() {
    try {
      // In a real app, this would be: const response = await axios.get('/api/roles');
      // For now, return mock data combined with custom roles
      const allRoles = [...this.mockRoles, ...this.customRoles];
      
      return {
        data: {
          data: allRoles,
          success: true
        }
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  /**
   * Get a single role by ID
   */
  async getRoleById(roleId) {
    try {
      const allRoles = [...this.mockRoles, ...this.customRoles];
      const role = allRoles.find(r => r._id === roleId);
      
      if (!role) {
        throw new Error('Role not found');
      }

      return {
        data: {
          data: role,
          success: true
        }
      };
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(roleData) {
    try {
      // In a real app, this would be: const response = await axios.post('/api/roles', roleData);
      
      // Validate role data
      if (!roleData.name || !roleData.displayName || !roleData.description) {
        throw new Error('Missing required fields');
      }

      // Check if role name already exists
      const allRoles = [...this.mockRoles, ...this.customRoles];
      const existingRole = allRoles.find(r => r.name === roleData.name.toLowerCase().replace(/\s+/g, '_'));
      
      if (existingRole) {
        throw new Error('Role with this name already exists');
      }

      const newRole = {
        _id: Date.now().toString(),
        ...roleData,
        name: roleData.name.toLowerCase().replace(/\s+/g, '_'),
        userCount: 0,
        isSystem: false,
        isActive: roleData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.customRoles.push(newRole);
      this.saveCustomRolesToStorage();

      return {
        data: {
          data: newRole,
          success: true,
          message: 'Role created successfully'
        }
      };
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async updateRole(roleId, roleData) {
    try {
      // In a real app, this would be: const response = await axios.put(`/api/roles/${roleId}`, roleData);
      
      const roleIndex = this.customRoles.findIndex(r => r._id === roleId);
      
      if (roleIndex === -1) {
        // Check if it's a system role
        const systemRole = this.mockRoles.find(r => r._id === roleId);
        if (systemRole?.isSystem) {
          throw new Error('System roles cannot be modified');
        }
        throw new Error('Role not found');
      }

      const updatedRole = {
        ...this.customRoles[roleIndex],
        ...roleData,
        name: roleData.name ? roleData.name.toLowerCase().replace(/\s+/g, '_') : this.customRoles[roleIndex].name,
        updatedAt: new Date()
      };

      this.customRoles[roleIndex] = updatedRole;
      this.saveCustomRolesToStorage();

      return {
        data: {
          data: updatedRole,
          success: true,
          message: 'Role updated successfully'
        }
      };
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId) {
    try {
      // In a real app, this would be: const response = await axios.delete(`/api/roles/${roleId}`);
      
      const roleIndex = this.customRoles.findIndex(r => r._id === roleId);
      
      if (roleIndex === -1) {
        // Check if it's a system role
        const systemRole = this.mockRoles.find(r => r._id === roleId);
        if (systemRole?.isSystem) {
          throw new Error('System roles cannot be deleted');
        }
        throw new Error('Role not found');
      }

      const role = this.customRoles[roleIndex];
      
      if (role.userCount > 0) {
        throw new Error('Cannot delete role that is assigned to users');
      }

      this.customRoles.splice(roleIndex, 1);
      this.saveCustomRolesToStorage();

      return {
        data: {
          success: true,
          message: 'Role deleted successfully'
        }
      };
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId, roleName) {
    try {
      // In a real app, this would be: const response = await axios.put(`/api/users/${userId}/role`, { role: roleName });
      
      // For mock implementation, just return success
      return {
        data: {
          success: true,
          message: 'User role updated successfully'
        }
      };
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Get available permissions grouped by category
   */
  getAvailablePermissions() {
    return {
      'Projects': [
        { key: PERMISSIONS.PROJECTS.VIEW_ALL, label: 'View All Projects' },
        { key: PERMISSIONS.PROJECTS.VIEW_ASSIGNED, label: 'View Assigned Projects' },
        { key: PERMISSIONS.PROJECTS.CREATE, label: 'Create Projects' },
        { key: PERMISSIONS.PROJECTS.UPDATE, label: 'Update Projects' },
        { key: PERMISSIONS.PROJECTS.DELETE, label: 'Delete Projects' }
      ],
      'Tasks': [
        { key: PERMISSIONS.TASKS.VIEW_ALL, label: 'View All Tasks' },
        { key: PERMISSIONS.TASKS.VIEW_ASSIGNED, label: 'View Assigned Tasks' },
        { key: PERMISSIONS.TASKS.CREATE, label: 'Create Tasks' },
        { key: PERMISSIONS.TASKS.UPDATE_ALL, label: 'Update All Tasks' },
        { key: PERMISSIONS.TASKS.UPDATE_OWN, label: 'Update Own Tasks' },
        { key: PERMISSIONS.TASKS.DELETE, label: 'Delete Tasks' }
      ],
      'Employees': [
        { key: PERMISSIONS.EMPLOYEES.VIEW_ALL, label: 'View All Employees' },
        { key: PERMISSIONS.EMPLOYEES.VIEW_BASIC, label: 'View Basic Employee Info' },
        { key: PERMISSIONS.EMPLOYEES.VIEW_SENSITIVE, label: 'View Sensitive Employee Info' },
        { key: PERMISSIONS.EMPLOYEES.CREATE, label: 'Create Employees' },
        { key: PERMISSIONS.EMPLOYEES.UPDATE, label: 'Update Employees' },
        { key: PERMISSIONS.EMPLOYEES.DELETE, label: 'Delete Employees' }
      ],
      'Users': [
        { key: PERMISSIONS.USERS.VIEW_ALL, label: 'View All Users' },
        { key: PERMISSIONS.USERS.VIEW_TEAM, label: 'View Team Members' },
        { key: PERMISSIONS.USERS.CREATE, label: 'Create Users' },
        { key: PERMISSIONS.USERS.UPDATE, label: 'Update Users' },
        { key: PERMISSIONS.USERS.DELETE, label: 'Delete Users' }
      ],
      'Roles': [
        { key: PERMISSIONS.ROLES.VIEW_ALL, label: 'View All Roles' },
        { key: PERMISSIONS.ROLES.CREATE, label: 'Create Roles' },
        { key: PERMISSIONS.ROLES.UPDATE, label: 'Update Roles' },
        { key: PERMISSIONS.ROLES.DELETE, label: 'Delete Roles' },
        { key: PERMISSIONS.ROLES.ASSIGN, label: 'Assign Roles' }
      ],
      'Navigation': [
        { key: PERMISSIONS.NAVIGATION.DASHBOARD, label: 'Access Dashboard' },
        { key: PERMISSIONS.NAVIGATION.PROJECTS, label: 'Access Projects' },
        { key: PERMISSIONS.NAVIGATION.TASKS, label: 'Access Tasks' },
        { key: PERMISSIONS.NAVIGATION.EMPLOYEES, label: 'Access Employees' },
        { key: PERMISSIONS.NAVIGATION.ROLES, label: 'Access Roles' },
        { key: PERMISSIONS.NAVIGATION.PROFILE, label: 'Access Profile' },
        { key: PERMISSIONS.NAVIGATION.REPORTS, label: 'Access Reports' },
        { key: PERMISSIONS.NAVIGATION.SETTINGS, label: 'Access Settings' }
      ]
    };
  }

  /**
   * Validate role data
   */
  validateRoleData(roleData) {
    const errors = [];

    if (!roleData.name || roleData.name.trim() === '') {
      errors.push('Role name is required');
    }

    if (!roleData.displayName || roleData.displayName.trim() === '') {
      errors.push('Display name is required');
    }

    if (!roleData.description || roleData.description.trim() === '') {
      errors.push('Description is required');
    }

    if (!roleData.permissions || !Array.isArray(roleData.permissions)) {
      errors.push('Permissions must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Filter roles based on criteria
   */
  filterRoles(roles, filters) {
    let filtered = [...roles];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(role => 
        role.displayName.toLowerCase().includes(searchTerm) ||
        role.description.toLowerCase().includes(searchTerm) ||
        role.name.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.hasUsers) {
      if (filters.hasUsers === 'with_users') {
        filtered = filtered.filter(role => role.userCount > 0);
      } else if (filters.hasUsers === 'without_users') {
        filtered = filtered.filter(role => role.userCount === 0);
      }
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter(role => role.isActive === filters.isActive);
    }

    if (filters.isSystem !== undefined) {
      filtered = filtered.filter(role => role.isSystem === filters.isSystem);
    }

    return filtered;
  }
}

// Create and export a singleton instance
const roleService = new RoleService();
export default roleService; 