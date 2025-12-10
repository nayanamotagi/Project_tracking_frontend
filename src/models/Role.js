import { PERMISSIONS } from '../utils/permissions';

/**
 * Role Model - Defines the structure and behavior of roles in the system
 */

// Role status constants
export const ROLE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Role type constants
export const ROLE_TYPE = {
  SYSTEM: 'system',
  CUSTOM: 'custom'
};

// Default system roles
export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager', 
  EMPLOYEE: 'employee'
};

/**
 * Role Class - Represents a role entity
 */
export class Role {
  constructor(data = {}) {
    this.id = data.id || data._id || null;
    this.name = data.name || '';
    this.displayName = data.displayName || '';
    this.description = data.description || '';
    this.permissions = Array.isArray(data.permissions) ? [...data.permissions] : [];
    this.isActive = data.isActive !== false;
    this.isSystem = data.isSystem || false;
    this.userCount = data.userCount || 0;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    this.createdBy = data.createdBy || null;
    this.updatedBy = data.updatedBy || null;
  }

  /**
   * Convert role to plain object for API calls
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      permissions: [...this.permissions],
      isActive: this.isActive,
      isSystem: this.isSystem,
      userCount: this.userCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy
    };
  }

  /**
   * Create a role from API response
   */
  static fromAPI(apiData) {
    return new Role(apiData);
  }

  /**
   * Create multiple roles from API response
   */
  static fromAPIArray(apiArray) {
    return apiArray.map(data => Role.fromAPI(data));
  }

  /**
   * Check if role has a specific permission
   */
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  /**
   * Add permission to role
   */
  addPermission(permission) {
    if (!this.hasPermission(permission)) {
      this.permissions.push(permission);
      this.updatedAt = new Date();
    }
    return this;
  }

  /**
   * Remove permission from role
   */
  removePermission(permission) {
    this.permissions = this.permissions.filter(p => p !== permission);
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Check if role can be deleted
   */
  canBeDeleted() {
    return !this.isSystem && this.userCount === 0;
  }

  /**
   * Check if role can be modified
   */
  canBeModified() {
    return !this.isSystem;
  }

  /**
   * Get role type
   */
  getType() {
    return this.isSystem ? ROLE_TYPE.SYSTEM : ROLE_TYPE.CUSTOM;
  }

  /**
   * Get role status
   */
  getStatus() {
    return this.isActive ? ROLE_STATUS.ACTIVE : ROLE_STATUS.INACTIVE;
  }

  /**
   * Update role properties
   */
  update(data) {
    if (data.displayName !== undefined) this.displayName = data.displayName;
    if (data.description !== undefined) this.description = data.description;
    if (data.permissions !== undefined) this.permissions = [...data.permissions];
    if (data.isActive !== undefined) this.isActive = data.isActive;
    if (data.userCount !== undefined) this.userCount = data.userCount;
    if (data.updatedBy !== undefined) this.updatedBy = data.updatedBy;
    
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Clone the role
   */
  clone() {
    return new Role(this.toJSON());
  }

  /**
   * Validate role data
   */
  validate() {
    const errors = [];

    // Required field validation
    if (!this.name || this.name.trim() === '') {
      errors.push('Role name is required');
    }

    if (!this.displayName || this.displayName.trim() === '') {
      errors.push('Display name is required');
    }

    if (!this.description || this.description.trim() === '') {
      errors.push('Description is required');
    }

    // Name format validation
    if (this.name && !/^[a-z0-9_]+$/.test(this.name)) {
      errors.push('Role name must contain only lowercase letters, numbers, and underscores');
    }

    // Permissions validation
    if (!Array.isArray(this.permissions)) {
      errors.push('Permissions must be an array');
    }

    // Length validations
    if (this.name && this.name.length > 50) {
      errors.push('Role name must be less than 50 characters');
    }

    if (this.displayName && this.displayName.length > 100) {
      errors.push('Display name must be less than 100 characters');
    }

    if (this.description && this.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Role Factory - Creates specific role instances
 */
export class RoleFactory {
  /**
   * Create an Admin role
   */
  static createAdminRole() {
    return new Role({
      name: SYSTEM_ROLES.ADMIN,
      displayName: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: Object.values(PERMISSIONS).flatMap(category => Object.values(category)),
      isSystem: true,
      isActive: true
    });
  }

  /**
   * Create a Project Manager role
   */
  static createProjectManagerRole() {
    return new Role({
      name: SYSTEM_ROLES.PROJECT_MANAGER,
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
      isSystem: true,
      isActive: true
    });
  }

  /**
   * Create an Employee role
   */
  static createEmployeeRole() {
    return new Role({
      name: SYSTEM_ROLES.EMPLOYEE,
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
      isSystem: true,
      isActive: true
    });
  }

  /**
   * Create a custom role
   */
  static createCustomRole(data) {
    return new Role({
      ...data,
      name: data.name ? data.name.toLowerCase().replace(/\s+/g, '_') : '',
      isSystem: false,
      isActive: data.isActive !== false
    });
  }

  /**
   * Get all default system roles
   */
  static getSystemRoles() {
    return [
      RoleFactory.createAdminRole(),
      RoleFactory.createProjectManagerRole(),
      RoleFactory.createEmployeeRole()
    ];
  }
}

/**
 * Role utilities and helper functions
 */
export class RoleUtils {
  /**
   * Filter roles based on criteria
   */
  static filterRoles(roles, filters = {}) {
    let filtered = [...roles];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(role => 
        role.displayName.toLowerCase().includes(searchTerm) ||
        role.description.toLowerCase().includes(searchTerm) ||
        role.name.toLowerCase().includes(searchTerm)
      );
    }

    // User assignment filter
    if (filters.hasUsers) {
      if (filters.hasUsers === 'with_users') {
        filtered = filtered.filter(role => role.userCount > 0);
      } else if (filters.hasUsers === 'without_users') {
        filtered = filtered.filter(role => role.userCount === 0);
      }
    }

    // Active status filter
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(role => role.isActive === filters.isActive);
    }

    // System/Custom filter
    if (filters.isSystem !== undefined) {
      filtered = filtered.filter(role => role.isSystem === filters.isSystem);
    }

    // Permission filter
    if (filters.hasPermission) {
      filtered = filtered.filter(role => role.hasPermission(filters.hasPermission));
    }

    return filtered;
  }

  /**
   * Sort roles by different criteria
   */
  static sortRoles(roles, sortBy = 'displayName', order = 'asc') {
    const sorted = [...roles].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle special cases
      if (sortBy === 'userCount') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Get role statistics
   */
  static getRoleStats(roles) {
    return {
      total: roles.length,
      active: roles.filter(r => r.isActive).length,
      inactive: roles.filter(r => !r.isActive).length,
      system: roles.filter(r => r.isSystem).length,
      custom: roles.filter(r => !r.isSystem).length,
      withUsers: roles.filter(r => r.userCount > 0).length,
      withoutUsers: roles.filter(r => r.userCount === 0).length,
      totalUsers: roles.reduce((sum, r) => sum + r.userCount, 0)
    };
  }

  /**
   * Validate role name uniqueness
   */
  static isRoleNameUnique(roleName, existingRoles, excludeId = null) {
    const normalizedName = roleName.toLowerCase().replace(/\s+/g, '_');
    return !existingRoles.some(role => 
      role.name === normalizedName && role.id !== excludeId
    );
  }

  /**
   * Get available permissions grouped by category
   */
  static getPermissionCategories() {
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
}

export default Role; 