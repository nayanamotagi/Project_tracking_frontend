import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  canCreateProject,
  canUpdateProject,
  canDeleteProject,
  getProjectsEndpoint
} from '../utils/permissions';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiFilter,
  FiSearch,
  FiFolder
} from 'react-icons/fi';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view
  const [selectedProject, setSelectedProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    budget: '',
    projectManager: '',
    priority: 'medium',
    tags: [],
    team: [],
    isActive: true
  });

  const [teamMember, setTeamMember] = useState({
    employee: '',
    role: '',
    assignedDate: ''
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin' || user?.role === 'project_manager') {
      fetchUsers();
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    filterProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const endpoint = getProjectsEndpoint(user);
      const response = await axios.get(endpoint);
      setProjects(response.data.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
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

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(project => project.priority === filters.priority);
    }

    if (filters.search) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const projectData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        tags: formData.tags ? formData.tags.map(tag => tag.trim()) : [],
        team: formData.team ? formData.team.map(member => ({
          employee: member.employee,
          role: member.role,
          assignedDate: member.assignedDate
        })) : [],
        projectManager: formData.projectManager || user._id
      };

      if (modalMode === 'create') {
        await axios.post('/api/projects', projectData);
        toast.success('Project created successfully');
      } else {
        await axios.put(`/api/projects/${selectedProject._id}`, projectData);
        toast.success('Project updated successfully');
      }

      setShowModal(false);
      fetchProjects();
      resetForm();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(error.response?.data?.message || 'Failed to save project');
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axios.delete(`/api/projects/${projectId}`);
        toast.success('Project deleted successfully');
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      }
    }
  };

  const openModal = (mode, project = null) => {
    setModalMode(mode);
    setSelectedProject(project);
    
    if (mode === 'create') {
      resetForm();
    } else if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        budget: project.budget || '',
        projectManager: project.projectManager?._id || project.projectManager || '',
        priority: project.priority || 'medium',
        tags: project.tags || [],
        team: project.team || [],
        isActive: project.isActive || true
      });
    }
    
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: '',
      projectManager: '',
      priority: 'medium',
      tags: [],
      team: [],
      isActive: true
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      planning: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-red-100 text-red-800',
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
      critical: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityClasses[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority?.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const userCanCreateProject = canCreateProject(user);
  const userCanDeleteProject = canDeleteProject(user);
  
  const canEditProject = (project) => {
    return canUpdateProject(user, project);
  };
  
  const canRemoveProject = (project) => {
    return userCanDeleteProject;
  };

  const addTeamMember = () => {
    if (teamMember.employee && teamMember.role && teamMember.assignedDate) {
      const isAlreadyAdded = formData.team.some(member => member.employee === teamMember.employee);
      if (!isAlreadyAdded) {
        setFormData(prev => ({ 
          ...prev, 
          team: [...prev.team, teamMember] 
        }));
        setTeamMember({ employee: '', role: '', assignedDate: '' });
      } else {
        toast.error('Employee is already added to the team');
      }
    } else {
      toast.error('Please fill in all team member fields');
    }
  };

  const removeTeamMember = (index) => {
    setFormData(prev => ({ 
      ...prev, 
      team: prev.team.filter((_, i) => i !== index) 
    }));
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
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage and track your projects</p>
        </div>
        {userCanCreateProject && (
          <button
            onClick={() => openModal('create')}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search projects..."
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
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
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
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', priority: '', search: '' })}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiFilter className="mr-2 h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <div key={project._id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {project.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal('view', project)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiEye className="h-4 w-4" />
                  </button>
                  {canEditProject(project) && (
                    <button
                      onClick={() => openModal('edit', project)}
                      className="text-blue-400 hover:text-blue-600"
                      title="Edit project"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                  )}
                  {canRemoveProject(project) && (
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete project"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {project.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {getStatusBadge(project.status)}
                  {getPriorityBadge(project.priority)}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <FiCalendar className="mr-2 h-4 w-4" />
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </div>

                {project.budget && (
                  <div className="flex items-center text-sm text-gray-500">
                    <FiDollarSign className="mr-2 h-4 w-4" />
                    {formatCurrency(project.budget)}
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-500">
                  <FiUsers className="mr-2 h-4 w-4" />
                  PM: {project.projectManager?.name || 'Unassigned'}
                </div>

                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{project.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FiFolder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {projects.length === 0 
              ? "Get started by creating a new project." 
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalMode === 'create' ? 'Create Project' : 
                 modalMode === 'edit' ? 'Edit Project' : 'Project Details'}
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
                  <h4 className="text-lg font-medium text-gray-900">{selectedProject?.name}</h4>
                  <p className="text-gray-600 mt-2">{selectedProject?.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedProject?.status)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Priority:</span>
                    <div className="mt-1">{getPriorityBadge(selectedProject?.priority)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Start Date:</span>
                    <p className="text-gray-900">{formatDate(selectedProject?.startDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">End Date:</span>
                    <p className="text-gray-900">{formatDate(selectedProject?.endDate)}</p>
                  </div>
                  {selectedProject?.budget && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Budget:</span>
                      <p className="text-gray-900">{formatCurrency(selectedProject.budget)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Project Manager:</span>
                    <p className="text-gray-900">{selectedProject?.projectManager?.name || 'Unassigned'}</p>
                  </div>
                </div>

                {selectedProject?.tags && selectedProject.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Tags:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedProject.tags.map((tag, index) => (
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
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="planning">Planning</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
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
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Budget
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  {(user?.role === 'admin') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Manager
                      </label>
                      <select
                        value={formData.projectManager}
                        onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select Project Manager</option>
                        {users.filter(u => u.role === 'project_manager' || u.role === 'admin').map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.employeeId})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
                            setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
                            setNewTag('');
                          }
                        }
                      }}
                      placeholder="Press Enter to add tags (e.g., web, mobile, urgent)"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }))}
                            className="ml-1 text-blue-400 hover:text-blue-600"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Team Management Section */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Team Members
                    </label>
                    
                    {/* Add Team Member Form */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Employee</label>
                          <select
                            value={teamMember.employee}
                            onChange={(e) => setTeamMember({ ...teamMember, employee: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="">Select Employee</option>
                            {employees.map((emp) => (
                              <option key={emp._id} value={emp._id}>
                                {emp.user?.name} ({emp.employeeId})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Role</label>
                          <select
                            value={teamMember.role}
                            onChange={(e) => setTeamMember({ ...teamMember, role: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="">Select Role</option>
                            <option value="developer">Developer</option>
                            <option value="designer">Designer</option>
                            <option value="analyst">Analyst</option>
                            <option value="tester">Tester</option>
                            <option value="lead">Team Lead</option>
                            <option value="coordinator">Coordinator</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Assigned Date</label>
                          <input
                            type="date"
                            value={teamMember.assignedDate}
                            onChange={(e) => setTeamMember({ ...teamMember, assignedDate: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={addTeamMember}
                            className="w-full px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Add Member
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Team Members List */}
                    {formData.team.length > 0 && (
                      <div className="border rounded-lg divide-y divide-gray-200">
                        <div className="px-4 py-2 bg-gray-50 rounded-t-lg">
                          <h4 className="text-sm font-medium text-gray-900">Project Team</h4>
                        </div>
                        {formData.team.map((member, index) => {
                          const employee = employees.find(emp => emp._id === member.employee);
                          return (
                            <div key={index} className="px-4 py-3 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {employee?.user?.name || 'Unknown Employee'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {employee?.employeeId} • {member.role} • Assigned: {new Date(member.assignedDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeTeamMember(index)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                    {modalMode === 'create' ? 'Create' : 'Update'} Project
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

export default Projects; 