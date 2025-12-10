// Role-based access control utility
// Defines permissions for different user roles

export const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  EMPLOYEE: 'employee'
};

export const PERMISSIONS = {
  // Project permissions
  PROJECTS: {
    VIEW_ALL: 'projects.view_all',
    VIEW_ASSIGNED: 'projects.view_assigned',
    CREATE: 'projects.create',
    UPDATE: 'projects.update',
    DELETE: 'projects.delete'
  },
  
  // Task permissions
  TASKS: {
    VIEW_ALL: 'tasks.view_all',
    VIEW_ASSIGNED: 'tasks.view_assigned',
    CREATE: 'tasks.create',
    UPDATE_ALL: 'tasks.update_all',
    UPDATE_OWN: 'tasks.update_own',
    DELETE: 'tasks.delete'
  },
  
  // Employee permissions
  EMPLOYEES: {
    VIEW_ALL: 'employees.view_all',
    VIEW_BASIC: 'employees.view_basic',
    VIEW_SENSITIVE: 'employees.view_sensitive',
    CREATE: 'employees.create',
    UPDATE: 'employees.update',
    DELETE: 'employees.delete'
  },
  
  // User permissions
  USERS: {
    VIEW_ALL: 'users.view_all',
    VIEW_TEAM: 'users.view_team',
    CREATE: 'users.create',
    UPDATE: 'users.update',
    DELETE: 'users.delete'
  },
  
  // Role permissions
  ROLES: {
    VIEW_ALL: 'roles.view_all',
    CREATE: 'roles.create',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
    ASSIGN: 'roles.assign'
  },

  // Navigation permissions
  NAVIGATION: {
    DASHBOARD: 'navigation.dashboard',
    PROJECTS: 'navigation.projects',
    TASKS: 'navigation.tasks',
    EMPLOYEES: 'navigation.employees',
    PROFILE: 'navigation.profile',
    ROLES: 'navigation.roles',
    REPORTS: 'navigation.reports',
    SETTINGS: 'navigation.settings'
  }
};

// Role-based permission mapping
const rolePermissions = {
  [ROLES.ADMIN]: [
    // Admin has full access to everything
    PERMISSIONS.PROJECTS.VIEW_ALL,
    PERMISSIONS.PROJECTS.CREATE,
    PERMISSIONS.PROJECTS.UPDATE,
    PERMISSIONS.PROJECTS.DELETE,
    
    PERMISSIONS.TASKS.VIEW_ALL,
    PERMISSIONS.TASKS.CREATE,
    PERMISSIONS.TASKS.UPDATE_ALL,
    PERMISSIONS.TASKS.DELETE,
    
    PERMISSIONS.EMPLOYEES.VIEW_ALL,
    PERMISSIONS.EMPLOYEES.VIEW_SENSITIVE,
    PERMISSIONS.EMPLOYEES.CREATE,
    PERMISSIONS.EMPLOYEES.UPDATE,
    PERMISSIONS.EMPLOYEES.DELETE,
    
    PERMISSIONS.USERS.VIEW_ALL,
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.USERS.DELETE,
    
    PERMISSIONS.ROLES.VIEW_ALL,
    PERMISSIONS.ROLES.CREATE,
    PERMISSIONS.ROLES.UPDATE,
    PERMISSIONS.ROLES.DELETE,
    PERMISSIONS.ROLES.ASSIGN,
    
    PERMISSIONS.NAVIGATION.DASHBOARD,
    PERMISSIONS.NAVIGATION.PROJECTS,
    PERMISSIONS.NAVIGATION.TASKS,
    PERMISSIONS.NAVIGATION.EMPLOYEES,
    PERMISSIONS.NAVIGATION.PROFILE,
    PERMISSIONS.NAVIGATION.ROLES,
    PERMISSIONS.NAVIGATION.REPORTS,
    PERMISSIONS.NAVIGATION.SETTINGS
  ],
  
  [ROLES.PROJECT_MANAGER]: [
    // Project Manager can create, read, update (but not delete) projects
    PERMISSIONS.PROJECTS.VIEW_ALL,
    PERMISSIONS.PROJECTS.CREATE,
    PERMISSIONS.PROJECTS.UPDATE,
    
    // Full CRUD on tasks in their projects
    PERMISSIONS.TASKS.VIEW_ALL,
    PERMISSIONS.TASKS.CREATE,
    PERMISSIONS.TASKS.UPDATE_ALL,
    PERMISSIONS.TASKS.DELETE,
    
    // Read access to view team members (basic info only)
    PERMISSIONS.EMPLOYEES.VIEW_BASIC,
    PERMISSIONS.USERS.VIEW_TEAM,
    
    PERMISSIONS.NAVIGATION.DASHBOARD,
    PERMISSIONS.NAVIGATION.PROJECTS,
    PERMISSIONS.NAVIGATION.TASKS,
    PERMISSIONS.NAVIGATION.EMPLOYEES,
    PERMISSIONS.NAVIGATION.PROFILE,
    PERMISSIONS.NAVIGATION.REPORTS
  ],
  
  [ROLES.EMPLOYEE]: [
    // Read access only to assigned projects
    PERMISSIONS.PROJECTS.VIEW_ASSIGNED,
    
    // Read all tasks in their projects, update only their own tasks
    PERMISSIONS.TASKS.VIEW_ASSIGNED,
    PERMISSIONS.TASKS.UPDATE_OWN,
    
    // Read access to view team members (basic info only)
    PERMISSIONS.EMPLOYEES.VIEW_BASIC,
    PERMISSIONS.USERS.VIEW_TEAM,
    
    PERMISSIONS.NAVIGATION.DASHBOARD,
    PERMISSIONS.NAVIGATION.PROJECTS,
    PERMISSIONS.NAVIGATION.TASKS,
    PERMISSIONS.NAVIGATION.EMPLOYEES,
    PERMISSIONS.NAVIGATION.PROFILE
  ]
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role property
 * @param {string} permission - Permission string to check
 * @returns {boolean} - Whether user has the permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if user can view all projects (Admin/PM) or only assigned ones (Employee)
 */
export const canViewAllProjects = (user) => {
  return hasPermission(user, PERMISSIONS.PROJECTS.VIEW_ALL);
};

/**
 * Check if user can create projects
 */
export const canCreateProject = (user) => {
  return hasPermission(user, PERMISSIONS.PROJECTS.CREATE);
};

/**
 * Check if user can update a specific project
 * @param {Object} user - Current user
 * @param {Object} project - Project to check
 */
export const canUpdateProject = (user, project) => {
  if (!hasPermission(user, PERMISSIONS.PROJECTS.UPDATE)) return false;
  
  // Admin can update any project
  if (user.role === ROLES.ADMIN) return true;
  
  // Project Manager can only update their own projects
  if (user.role === ROLES.PROJECT_MANAGER) {
    return project?.projectManager?._id === user._id || project?.projectManager === user._id;
  }
  
  return false;
};

/**
 * Check if user can delete projects
 */
export const canDeleteProject = (user) => {
  return hasPermission(user, PERMISSIONS.PROJECTS.DELETE);
};

/**
 * Check if user can view all tasks or only assigned ones
 */
export const canViewAllTasks = (user) => {
  return hasPermission(user, PERMISSIONS.TASKS.VIEW_ALL);
};

/**
 * Check if user can create tasks
 */
export const canCreateTask = (user) => {
  return hasPermission(user, PERMISSIONS.TASKS.CREATE);
};

/**
 * Check if user can update a specific task
 * @param {Object} user - Current user
 * @param {Object} task - Task to check
 */
export const canUpdateTask = (user, task) => {
  // Admin and PM can update any task
  if (hasPermission(user, PERMISSIONS.TASKS.UPDATE_ALL)) return true;
  
  // Employee can only update their own tasks
  if (hasPermission(user, PERMISSIONS.TASKS.UPDATE_OWN)) {
    return task?.assignedTo?._id === user._id || task?.assignedTo === user._id;
  }
  
  return false;
};

/**
 * Check if user can delete tasks
 */
export const canDeleteTask = (user) => {
  return hasPermission(user, PERMISSIONS.TASKS.DELETE);
};

/**
 * Check if user can manage employees (create/update)
 */
export const canManageEmployees = (user) => {
  return hasPermission(user, PERMISSIONS.EMPLOYEES.CREATE) || 
         hasPermission(user, PERMISSIONS.EMPLOYEES.UPDATE);
};

/**
 * Check if user can view sensitive employee information (salary, etc.)
 */
export const canViewSensitiveEmployeeInfo = (user) => {
  return hasPermission(user, PERMISSIONS.EMPLOYEES.VIEW_SENSITIVE);
};

/**
 * Check if user can delete employees
 */
export const canDeleteEmployee = (user) => {
  return hasPermission(user, PERMISSIONS.EMPLOYEES.DELETE);
};

/**
 * Check if user can manage roles
 */
export const canManageRoles = (user) => {
  return hasPermission(user, PERMISSIONS.ROLES.VIEW_ALL) ||
         hasPermission(user, PERMISSIONS.ROLES.CREATE) ||
         hasPermission(user, PERMISSIONS.ROLES.UPDATE);
};

/**
 * Check if user can create roles
 */
export const canCreateRole = (user) => {
  return hasPermission(user, PERMISSIONS.ROLES.CREATE);
};

/**
 * Check if user can update roles
 */
export const canUpdateRole = (user) => {
  return hasPermission(user, PERMISSIONS.ROLES.UPDATE);
};

/**
 * Check if user can delete roles
 */
export const canDeleteRole = (user) => {
  return hasPermission(user, PERMISSIONS.ROLES.DELETE);
};

/**
 * Check if user can assign roles to users
 */
export const canAssignRoles = (user) => {
  return hasPermission(user, PERMISSIONS.ROLES.ASSIGN);
};

/**
 * Check if user can view all users
 */
export const canViewAllUsers = (user) => {
  return hasPermission(user, PERMISSIONS.USERS.VIEW_ALL);
};

/**
 * Check if user can view team users
 */
export const canViewTeamUsers = (user) => {
  return hasPermission(user, PERMISSIONS.USERS.VIEW_TEAM);
};

/**
 * Check if user can create users
 */
export const canCreateUser = (user) => {
  return hasPermission(user, PERMISSIONS.USERS.CREATE);
};

/**
 * Check if user can update users
 */
export const canUpdateUser = (user) => {
  return hasPermission(user, PERMISSIONS.USERS.UPDATE);
};

/**
 * Check if user can delete users
 */
export const canDeleteUser = (user) => {
  return hasPermission(user, PERMISSIONS.USERS.DELETE);
};

/**
 * Check if user can access a specific navigation item
 */
export const canAccessNavigation = (user, navItem) => {
  const navPermissions = {
    dashboard: PERMISSIONS.NAVIGATION.DASHBOARD,
    projects: PERMISSIONS.NAVIGATION.PROJECTS,
    tasks: PERMISSIONS.NAVIGATION.TASKS,
    employees: PERMISSIONS.NAVIGATION.EMPLOYEES,
    profile: PERMISSIONS.NAVIGATION.PROFILE,
    roles: PERMISSIONS.NAVIGATION.ROLES,
    reports: PERMISSIONS.NAVIGATION.REPORTS,
    settings: PERMISSIONS.NAVIGATION.SETTINGS
  };
  
  const permission = navPermissions[navItem.toLowerCase()];
  
  // Special case for Roles: Only admin users can access
  if (navItem.toLowerCase() === 'roles') {
    return user?.role === 'admin';
  }
  
  return permission ? hasPermission(user, permission) : false;
};

/**
 * Get appropriate API endpoint based on user role
 */
export const getProjectsEndpoint = (user) => {
  return canViewAllProjects(user) ? '/api/projects' : '/api/projects/my-projects';
};

/**
 * Get appropriate API endpoint for tasks based on user role
 */
export const getTasksEndpoint = (user) => {
  return canViewAllTasks(user) ? '/api/tasks' : '/api/tasks/my-tasks';
};

/**
 * Filter navigation items based on user permissions
 */
export const getAccessibleNavigationItems = (user, navigationItems) => {
  return navigationItems.filter(item => canAccessNavigation(user, item.name));
};

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  canViewAllProjects,
  canCreateProject,
  canUpdateProject,
  canDeleteProject,
  canViewAllTasks,
  canCreateTask,
  canUpdateTask,
  canDeleteTask,
  canManageEmployees,
  canViewSensitiveEmployeeInfo,
  canDeleteEmployee,
  canManageRoles,
  canCreateRole,
  canUpdateRole,
  canDeleteRole,
  canAssignRoles,
  canViewAllUsers,
  canViewTeamUsers,
  canCreateUser,
  canUpdateUser,
  canDeleteUser,
  canAccessNavigation,
  getProjectsEndpoint,
  getTasksEndpoint,
  getAccessibleNavigationItems
}; 