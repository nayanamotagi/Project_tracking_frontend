import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  canManageEmployees,
  canViewSensitiveEmployeeInfo,
  canDeleteEmployee
} from '../utils/permissions';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiFilter,
  FiSearch,
  FiStar
} from 'react-icons/fi';

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // create, edit, view
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    search: '',
    status: 'active'
  });

  const [formData, setFormData] = useState({
    userId: '',
    employeeId: '',
    name: '',
    email: '',
    department: '',
    position: '',
    hireDate: '',
    salary: '',
    skills: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    }
  });

  const filterEmployees = useCallback(() => {
    let filtered = employees;

    if (filters.department) {
      filtered = filtered.filter(emp => 
        emp.department?.toLowerCase().includes(filters.department.toLowerCase())
      );
    }

    if (filters.status) {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(emp => emp.isActive === isActive);
    }

    if (filters.search) {
      filtered = filtered.filter(emp => 
        emp.user?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.department?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.position?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
  }, [employees, filters]);

  useEffect(() => {
    fetchEmployees();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user?.role]);

  useEffect(() => {
    filterEmployees();
  }, [filterEmployees]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await axios.get('/api/users');
      console.log('Users response:', response.data);
      const userData = response.data.data || [];
      console.log('Setting users:', userData);
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employees');
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const employeeData = {
        userId: formData.userId,
        employeeId: formData.employeeId,
        department: formData.department,
        position: formData.position,
        hireDate: formData.hireDate,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        skills: formData.skills ? formData.skills.split(',').map(skill => skill.trim()) : [],
        contactInfo: {
          phone: formData.phone,
          address: formData.address
        },
        emergencyContact: formData.emergencyContact
      };

      // Debug logging
      console.log('Form Data being sent:', employeeData);
      console.log('User ID being sent:', employeeData.userId);
      console.log('Available users:', users);

      if (modalMode === 'create') {
        console.log('Creating employee with data:', employeeData);
        
        // Check authentication
        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);
        if (token) {
          console.log('Token preview:', token.substring(0, 20) + '...');
        }
        
        const response = await axios.post('/api/employees', employeeData);
        console.log('Create employee response:', response.data);
        toast.success('Employee created successfully');
      } else {
        await axios.put(`/api/employees/${selectedEmployee._id}`, employeeData);
        toast.success('Employee updated successfully');
      }

      setShowModal(false);
      fetchEmployees();
      resetForm();
    } catch (error) {
      console.error('Error saving employee:', error);
      console.error('Error response:', error.response);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          'Failed to save employee';
      
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`/api/employees/${employeeId}`);
        toast.success('Employee deleted successfully');
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to delete employee');
      }
    }
  };

  const openModal = (mode, employee = null) => {
    setModalMode(mode);
    setSelectedEmployee(employee);
    
    if (mode === 'create') {
      resetForm();
    } else if (employee) {
      setFormData({
        employeeId: employee.employeeId || '',
        name: employee.user?.name || '',
        email: employee.user?.email || '',
        department: employee.department || '',
        position: employee.position || '',
        hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
        salary: employee.salary || '',
        skills: employee.skills ? employee.skills.join(', ') : '',
        phone: employee.contactInfo?.phone || '',
        address: {
          street: employee.contactInfo?.address?.street || '',
          city: employee.contactInfo?.address?.city || '',
          state: employee.contactInfo?.address?.state || '',
          zipCode: employee.contactInfo?.address?.zipCode || '',
          country: employee.contactInfo?.address?.country || ''
        },
        emergencyContact: {
          name: employee.emergencyContact?.name || '',
          relationship: employee.emergencyContact?.relationship || '',
          phone: employee.emergencyContact?.phone || '',
          email: employee.emergencyContact?.email || ''
        }
      });
    }
    
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      employeeId: '',
      name: '',
      email: '',
      department: '',
      position: '',
      hireDate: '',
      salary: '',
      skills: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      }
    });
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

  const getPerformanceStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  const userCanManageEmployees = canManageEmployees(user);
  const userCanViewSensitiveInfo = canViewSensitiveEmployeeInfo(user);
  const userCanDeleteEmployee = canDeleteEmployee(user);

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
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage team members and their information</p>
        </div>
        {userCanManageEmployees && (
          <button
            onClick={() => openModal('create')}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Add Employee
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
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              placeholder="Filter by department"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ department: '', search: '', status: '' })}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiFilter className="mr-2 h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <div key={employee._id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <FiUser className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {employee.user?.name || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-500">{employee.employeeId}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal('view', employee)}
                    className="text-gray-400 hover:text-gray-600"
                    title="View details"
                  >
                    <FiEye className="h-4 w-4" />
                  </button>
                  {userCanManageEmployees && (
                    <button
                      onClick={() => openModal('edit', employee)}
                      className="text-blue-400 hover:text-blue-600"
                      title="Edit employee"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                  )}
                  {userCanDeleteEmployee && (
                    <button
                      onClick={() => handleDelete(employee._id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete employee"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <FiBriefcase className="mr-2 h-4 w-4" />
                  {employee.position} - {employee.department}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <FiMail className="mr-2 h-4 w-4" />
                  {employee.user?.email || 'N/A'}
                </div>

                {employee.contactInfo?.phone && (
                  <div className="flex items-center text-sm text-gray-500">
                    <FiPhone className="mr-2 h-4 w-4" />
                    {employee.contactInfo.phone}
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-500">
                  <FiCalendar className="mr-2 h-4 w-4" />
                  Joined: {formatDate(employee.hireDate)}
                </div>

                {userCanViewSensitiveInfo && employee.salary && (
                  <div className="flex items-center text-sm text-gray-500">
                    <FiDollarSign className="mr-2 h-4 w-4" />
                    {formatCurrency(employee.salary)}
                  </div>
                )}

                {employee.performance?.rating && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">Rating:</span>
                    <div className="flex items-center">
                      {getPerformanceStars(employee.performance.rating)}
                    </div>
                  </div>
                )}

                {employee.skills && employee.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {employee.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {employee.skills.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{employee.skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  {employee.currentProjects && employee.currentProjects.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {employee.currentProjects.length} project{employee.currentProjects.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <FiUser className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {employees.length === 0 
              ? "Get started by adding a new employee." 
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalMode === 'create' ? 'Add Employee' : 
                 modalMode === 'edit' ? 'Edit Employee' : 'Employee Details'}
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
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <p className="text-gray-900">{selectedEmployee?.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Employee ID:</span>
                      <p className="text-gray-900">{selectedEmployee?.employeeId}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Email:</span>
                      <p className="text-gray-900">{selectedEmployee?.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Department:</span>
                      <p className="text-gray-900">{selectedEmployee?.department}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Position:</span>
                      <p className="text-gray-900">{selectedEmployee?.position}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Hire Date:</span>
                      <p className="text-gray-900">{formatDate(selectedEmployee?.hireDate)}</p>
                    </div>
                    {userCanViewSensitiveInfo && selectedEmployee?.salary && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Salary:</span>
                        <p className="text-gray-900">{formatCurrency(selectedEmployee.salary)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedEmployee?.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedEmployee?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {selectedEmployee?.skills && selectedEmployee.skills.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {userCanViewSensitiveInfo && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedEmployee?.contactInfo?.phone && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Phone:</span>
                          <p className="text-gray-900">{selectedEmployee.contactInfo.phone}</p>
                        </div>
                      )}
                      {selectedEmployee?.contactInfo?.address && (
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-gray-500">Address:</span>
                          <p className="text-gray-900">
                            {[
                              selectedEmployee.contactInfo.address.street,
                              selectedEmployee.contactInfo.address.city,
                              selectedEmployee.contactInfo.address.state,
                              selectedEmployee.contactInfo.address.zipCode,
                              selectedEmployee.contactInfo.address.country
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                {userCanViewSensitiveInfo && selectedEmployee?.emergencyContact?.name && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-gray-900">{selectedEmployee.emergencyContact.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Relationship:</span>
                        <p className="text-gray-900">{selectedEmployee.emergencyContact.relationship}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Phone:</span>
                        <p className="text-gray-900">{selectedEmployee.emergencyContact.phone}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <p className="text-gray-900">{selectedEmployee.emergencyContact.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance */}
                {selectedEmployee?.performance && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Rating:</span>
                        <div className="flex items-center mt-1">
                          {getPerformanceStars(selectedEmployee.performance.rating)}
                          <span className="ml-2 text-sm text-gray-600">
                            ({selectedEmployee.performance.rating}/5)
                          </span>
                        </div>
                      </div>
                      {selectedEmployee.performance.lastReviewDate && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Last Review:</span>
                          <p className="text-gray-900">{formatDate(selectedEmployee.performance.lastReviewDate)}</p>
                        </div>
                      )}
                      {selectedEmployee.performance.notes && (
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-gray-500">Notes:</span>
                          <p className="text-gray-900">{selectedEmployee.performance.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Selection */}
                {modalMode === 'create' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">User Association</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Select User *
                      </label>
                      <select
                        required
                        value={formData.userId}
                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Choose a user...</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email}) - {user.role}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Select the user account that this employee profile will be linked to.
                      </p>
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Employee ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Department *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Position *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hire Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.hireDate}
                        onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    {userCanViewSensitiveInfo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Salary
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.salary}
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        placeholder="JavaScript, React, Node.js"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, street: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, city: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, state: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, zipCode: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, country: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact.relationship}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.emergencyContact.email}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          emergencyContact: { ...formData.emergencyContact, email: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
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
                    {modalMode === 'create' ? 'Add' : 'Update'} Employee
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

export default Employees; 