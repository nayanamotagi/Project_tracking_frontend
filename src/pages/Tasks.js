import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  canCreateTask,
  canUpdateTask,
  canDeleteTask,
  getTasksEndpoint,
  getProjectsEndpoint,
  canViewAllUsers,
  canViewTeamUsers
} from '../utils/permissions';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiClock,
  FiUser,
  FiFolder,
  FiFilter,
  FiSearch
} from 'react-icons/fi';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    project: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    assignedTo: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    tags: '',
    progress: 0
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    // Fetch users if user can view team or all users (for task assignment)
    if (canViewAllUsers(user) || canViewTeamUsers(user) || canCreateTask(user)) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    filterTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const endpoint = getTasksEndpoint(user);
      const response = await axios.get(endpoint);
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const endpoint = getProjectsEndpoint(user);
      const response = await axios.get(endpoint);
      setProjects(response.data.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users for task assignment...');
      const response = await axios.get('/api/users');
      console.log('Users API response:', response.data);
      
      const userData = response.data.data || response.data || [];
      console.log('Setting users data:', userData);
      setUsers(userData);
      
      if (userData.length === 0) {
        console.warn('No users returned from API');
        toast.error('No users available for task assignment');
      } else {
        console.log(`Loaded ${userData.length} users for task assignment`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users. You may not be able to assign tasks.');
      
      // For demo purposes, add some fallback users if API fails
      if (process.env.NODE_ENV === 'development') {
        const fallbackUsers = [
          { _id: 'user1', name: 'John Doe', employeeId: 'EMP001', email: 'john@example.com' },
          { _id: 'user2', name: 'Jane Smith', employeeId: 'EMP002', email: 'jane@example.com' },
          { _id: 'user3', name: 'Bob Wilson', employeeId: 'EMP003', email: 'bob@example.com' }
        ];
        setUsers(fallbackUsers);
        console.log('Using fallback users for development');
      }
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.project) {
      filtered = filtered.filter(task => task.project?._id === filters.project);
    }

    if (filters.search) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const taskData = {
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : 0,
        progress: parseInt(formData.progress) || 0,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        assignedBy: user._id
      };

      if (modalMode === 'create') {
        await axios.post('/api/tasks', taskData);
        toast.success('Task created successfully');
      } else {
        await axios.put(`/api/tasks/${selectedTask._id}`, taskData);
        toast.success('Task updated successfully');
      }

      setShowModal(false);
      fetchTasks();
      resetForm();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(error.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        toast.success('Task deleted successfully');
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
      }
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      toast.success('Task status updated');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const openModal = (mode, task = null) => {
    setModalMode(mode);
    setSelectedTask(task);
    
    if (mode === 'create') {
      resetForm();
    } else if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        project: task.project?._id || '',
        assignedTo: task.assignedTo?._id || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours || '',
        tags: task.tags ? task.tags.join(', ') : '',
        progress: task.progress || 0
      });
    }
    
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project: '',
      assignedTo: '',
      status: 'pending',
      priority: 'medium',
      dueDate: '',
      estimatedHours: '',
      tags: '',
      progress: 0
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityClasses[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority?.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  const userCanCreateTask = canCreateTask(user);
  const userCanDeleteTask = canDeleteTask(user);
  
  const canEditTask = (task) => {
    return canUpdateTask(user, task);
  };
  
  // Debug logging for user assignment issue
  React.useEffect(() => {
    if (user) {
      console.log('=== TASK ASSIGNMENT DEBUG ===');
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      console.log('Can create task:', canCreateTask(user));
      console.log('Can view all users:', canViewAllUsers(user));
      console.log('Can view team users:', canViewTeamUsers(user));
      console.log('Users loaded for assignment:', users.length);
      console.log('Users data:', users);
      console.log('=== END DEBUG ===');
    }
  }, [user, users]);
  
  const canRemoveTask = (task) => {
    return userCanDeleteTask;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">
            {user?.role === 'employee' ? 'Your assigned tasks' : 'Manage and track tasks'}
          </p>
          {/* Debug info for Nayana */}
          {process.env.NODE_ENV === 'development' && user?.role === 'project_manager' && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="text-blue-800">
                <strong>Debug Info for Nayana:</strong> 
                {users.length > 0 ? (
                  <span className="text-green-600"> ✅ {users.length} users loaded for task assignment</span>
                ) : (
                  <span className="text-red-600"> ❌ No users loaded - check browser console for details</span>
                )}
              </p>
            </div>
          )}
        </div>
        {userCanCreateTask && (
          <button
            onClick={() => openModal('create')}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={filters.project}
              onChange={(e) => setFilters({ ...filters, project: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', priority: '', project: '', search: '' })}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiFilter className="mr-2 h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredTasks.map((task) => (
            <li key={task._id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {task.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {isOverdue(task.dueDate, task.status) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          OVERDUE
                        </span>
                      )}
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {task.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiFolder className="mr-2 h-4 w-4" />
                      {task.project?.name || 'No Project'}
                    </div>
                    
                    <div className="flex items-center">
                      <FiUser className="mr-2 h-4 w-4" />
                      {task.assignedTo?.name || 'Unassigned'}
                    </div>

                    <div className="flex items-center">
                      <FiCalendar className="mr-2 h-4 w-4" />
                      Due: {formatDate(task.dueDate)}
                    </div>

                    {task.estimatedHours > 0 && (
                      <div className="flex items-center">
                        <FiClock className="mr-2 h-4 w-4" />
                        {task.estimatedHours}h estimated
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {task.progress > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-gray-900 font-medium">{task.progress}%</span>
                      </div>
                      <div className="mt-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {task.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{task.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="ml-4 flex items-center space-x-2">
                  {/* Quick Status Update for assigned users */}
                  {task.assignedTo?._id === user._id && task.status !== 'completed' && (
                    <div className="flex items-center space-x-1">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(task._id, 'in_progress')}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Start
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusUpdate(task._id, 'completed')}
                          className="text-green-600 hover:text-green-800 text-xs font-medium"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => openModal('view', task)}
                    className="text-gray-400 hover:text-gray-600"
                    title="View details"
                  >
                    <FiEye className="h-4 w-4" />
                  </button>

                  {canEditTask(task) && (
                    <button
                      onClick={() => openModal('edit', task)}
                      className="text-blue-400 hover:text-blue-600"
                      title="Edit task"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                  )}

                  {canRemoveTask(task) && (
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete task"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <FiClock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {tasks.length === 0 
                ? (userCanCreateTask ? "Get started by creating a new task." : "No tasks have been assigned to you yet.")
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalMode === 'create' ? 'Create Task' : 
                 modalMode === 'edit' ? 'Edit Task' : 'Task Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalMode === 'view' ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{selectedTask?.title}</h4>
                  <p className="text-gray-600 mt-2">{selectedTask?.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedTask?.status)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Priority:</span>
                    <div className="mt-1">{getPriorityBadge(selectedTask?.priority)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Project:</span>
                    <p className="text-gray-900">{selectedTask?.project?.name || 'No Project'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned To:</span>
                    <p className="text-gray-900">{selectedTask?.assignedTo?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Due Date:</span>
                    <p className="text-gray-900">{formatDate(selectedTask?.dueDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Estimated Hours:</span>
                    <p className="text-gray-900">{selectedTask?.estimatedHours || 0}h</p>
                  </div>
                </div>

                {selectedTask?.progress > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Progress:</span>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-900 font-medium">{selectedTask.progress}%</span>
                      </div>
                      <div className="mt-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedTask.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTask?.tags && selectedTask.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Tags:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedTask.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Project *
                    </label>
                    <select
                      required
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assign To *
                    </label>
                    <select
                      required
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">
                        {users.length === 0 ? 'Loading users...' : 'Select User'}
                      </option>
                      {users.length > 0 ? (
                        users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} {user.employeeId && `(${user.employeeId})`}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No users available</option>
                      )}
                    </select>
                    {users.length === 0 && (
                      <p className="mt-1 text-sm text-red-600">
                        ⚠️ No users loaded. Please refresh the page or contact support.
                      </p>
                    )}
                    {users.length > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        {users.length} user{users.length !== 1 ? 's' : ''} available for assignment
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Progress (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="frontend, backend, urgent"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
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
                    {modalMode === 'create' ? 'Create' : 'Update'} Task
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks; 