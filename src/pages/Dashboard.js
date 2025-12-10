import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  canViewAllProjects,
  canViewAllTasks,
  getProjectsEndpoint,
  getTasksEndpoint
} from '../utils/permissions';
import {
  FiFolder,
  FiCheckSquare,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiTarget,
  FiActivity,
  FiCalendar
} from 'react-icons/fi';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: { total: 0, active: 0, completed: 0 },
    tasks: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    employees: { total: 0, active: 0 },
    myTasks: { total: 0, pending: 0, inProgress: 0, completed: 0 }
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic stats based on user role
      const requests = [];
      const userCanViewAllProjects = canViewAllProjects(user);
      const userCanViewAllTasks = canViewAllTasks(user);
      
      if (userCanViewAllProjects && userCanViewAllTasks) {
        // Admin or Project Manager
        requests.push(
          axios.get(getProjectsEndpoint(user)),
          axios.get(getTasksEndpoint(user)),
          axios.get('/api/users')
        );
      } else {
        // Employee
        requests.push(
          axios.get(getTasksEndpoint(user)),
          axios.get(getProjectsEndpoint(user))
        );
      }

      const responses = await Promise.all(requests);
      
      if (userCanViewAllProjects && userCanViewAllTasks) {
        const [projectsRes, tasksRes, usersRes] = responses;
        
        setStats({
          projects: {
            total: projectsRes.data.data?.length || 0,
            active: projectsRes.data.data?.filter(p => p.status === 'in_progress').length || 0,
            completed: projectsRes.data.data?.filter(p => p.status === 'completed').length || 0
          },
          tasks: {
            total: tasksRes.data.data?.length || 0,
            pending: tasksRes.data.data?.filter(t => t.status === 'pending').length || 0,
            inProgress: tasksRes.data.data?.filter(t => t.status === 'in_progress').length || 0,
            completed: tasksRes.data.data?.filter(t => t.status === 'completed').length || 0
          },
          employees: {
            total: usersRes.data.data?.length || 0,
            active: usersRes.data.data?.filter(u => u.isActive).length || 0
          }
        });
        
        setRecentTasks(tasksRes.data.data?.slice(0, 5) || []);
        setRecentProjects(projectsRes.data.data?.slice(0, 5) || []);
      } else {
        const [tasksRes, projectsRes] = responses;
        
        setStats({
          myTasks: {
            total: tasksRes.data.data?.length || 0,
            pending: tasksRes.data.data?.filter(t => t.status === 'pending').length || 0,
            inProgress: tasksRes.data.data?.filter(t => t.status === 'in_progress').length || 0,
            completed: tasksRes.data.data?.filter(t => t.status === 'completed').length || 0
          }
        });
        
        setRecentTasks(tasksRes.data.data?.slice(0, 5) || []);
        setRecentProjects(projectsRes.data.data?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusData = () => {
    const userCanViewAllTasks = canViewAllTasks(user);
    
    if (userCanViewAllTasks) {
      return [
        { name: 'Pending', value: stats.tasks.pending, color: '#ef4444' },
        { name: 'In Progress', value: stats.tasks.inProgress, color: '#f59e0b' },
        { name: 'Completed', value: stats.tasks.completed, color: '#10b981' }
      ];
    } else {
      return [
        { name: 'Pending', value: stats.myTasks.pending, color: '#ef4444' },
        { name: 'In Progress', value: stats.myTasks.inProgress, color: '#f59e0b' },
        { name: 'Completed', value: stats.myTasks.completed, color: '#10b981' }
      ];
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid */}
        {canViewAllTasks(user) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Projects"
              value={stats.projects.total}
              icon={FiFolder}
              color="bg-blue-500"
              subtext={`${stats.projects.active} active`}
            />
            <StatCard
              title="Total Tasks"
              value={stats.tasks.total}
              icon={FiCheckSquare}
              color="bg-green-500"
              subtext={`${stats.tasks.completed} completed`}
            />
            <StatCard
              title="Team Members"
              value={stats.employees.total}
              icon={FiUsers}
              color="bg-purple-500"
              subtext={`${stats.employees.active} active`}
            />
            <StatCard
              title="In Progress"
              value={stats.tasks.inProgress}
              icon={FiActivity}
              color="bg-orange-500"
              subtext="Active tasks"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="My Tasks"
              value={stats.myTasks.total}
              icon={FiCheckSquare}
              color="bg-blue-500"
              subtext="Assigned to me"
            />
            <StatCard
              title="Pending"
              value={stats.myTasks.pending}
              icon={FiClock}
              color="bg-red-500"
              subtext="Awaiting start"
            />
            <StatCard
              title="In Progress"
              value={stats.myTasks.inProgress}
              icon={FiActivity}
              color="bg-orange-500"
              subtext="Currently working"
            />
            <StatCard
              title="Completed"
              value={stats.myTasks.completed}
              icon={FiTarget}
              color="bg-green-500"
              subtext="Finished tasks"
            />
          </div>
        )}

        {/* Charts and Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Status Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getTaskStatusData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {getTaskStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
            <div className="space-y-3">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.project?.name || 'No Project'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent tasks</p>
              )}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
            <div className="space-y-3">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div key={project._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <div className="flex items-center mt-1">
                        <FiCalendar className="w-3 h-3 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500">
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No deadline'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent projects</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 