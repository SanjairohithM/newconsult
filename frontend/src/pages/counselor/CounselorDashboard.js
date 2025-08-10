import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Link, useNavigate } from 'react-router-dom';

import {
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Settings,
  MessageCircle,
  Video,
  Calendar as CalendarIcon,
  ExternalLink,
  Send,
  Copy,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  LogOut,
} from 'lucide-react';

export default function CounselorDashboard() {
  const navigate = useNavigate();
  const [counselor, setCounselor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  
  // New states for meeting link modal
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

    // New states for pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState('all');

  const [stats, setStats] = useState({
    totalSessions: 0,
    averageRating: 0,
    totalClients: 0,
    upcomingSessions: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sessionTypeFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sessionTypeFilter]);

  const fetchDashboardData = async () => {
    try {
      const profileRes = await axios.get('/api/auth/me');
      setCounselor(profileRes.data);

      const appointmentsRes = await axios.get('/api/appointments');
      setAppointments(appointmentsRes.data);

      const upcomingSessions = appointmentsRes.data.filter(
        (apt) =>
          new Date(apt.date) > new Date() && apt.status === 'confirmed'
      ).length;

      const completedSessions = appointmentsRes.data.filter(
        (apt) => apt.status === 'completed'
      ).length;

      const totalEarnings =
        completedSessions * (profileRes.data.hourlyRate || 100);

      const thisMonthEarnings = appointmentsRes.data
        .filter((apt) => {
          const aptDate = new Date(apt.date);
          const now = new Date();
          return (
            apt.status === 'completed' &&
            aptDate.getMonth() === now.getMonth() &&
            aptDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum) => sum + (profileRes.data.hourlyRate || 100), 0);

      setStats({
        totalSessions: completedSessions,
        averageRating: profileRes.data.rating || 0,
        totalClients: new Set(appointmentsRes.data.map((apt) => apt.clientId))
          .size,
        upcomingSessions,
      });

      setEarnings({
        total: totalEarnings,
        thisMonth: thisMonthEarnings,
        thisWeek: thisMonthEarnings * 0.25,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  // Filter and pagination logic
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = searchQuery === '' || 
      apt.client?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.client?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.client?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesSessionType = sessionTypeFilter === 'all' || apt.sessionType === sessionTypeFilter;
    
    return matchesSearch && matchesStatus && matchesSessionType;
  });

  // Pagination logic
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Step 1 & 2: Redirect to Google Meet home page
  const handleStartVideoCall = (appointment) => {
    setSelectedAppointment(appointment);
    setMeetingLinkInput('');
    
    // Step 2: Open Google Meet home page in new tab
    window.open('https://meet.google.com', '_blank');
    
    // Step 3: Show modal for counselor to paste the link
    setShowMeetingModal(true);
  };

  // Step 4: Send meeting link to client
  const handleSendMeetingLink = async () => {
    if (!meetingLinkInput.trim()) {
      alert('Please paste the Google Meet link first');
      return;
    }

    if (!meetingLinkInput.includes('meet.google.com')) {
      alert('Please enter a valid Google Meet link');
      return;
    }

    setSendingLink(true);
    
    try {
      const response = await axios.post(`/api/appointments/${selectedAppointment._id}/send-meeting-link`, {
        meetingLink: meetingLinkInput
      });

      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt._id === selectedAppointment._id 
          ? { ...apt, meetingLink: meetingLinkInput, status: 'confirmed', meetingPlatform: 'google-meet-manual' }
          : apt
      ));

      alert('Meeting link sent to client successfully!');
      setShowMeetingModal(false);
      setMeetingLinkInput('');
      setSelectedAppointment(null);
      
    } catch (error) {
      console.error('Error sending meeting link:', error);
      alert('Failed to send meeting link. Please try again.');
    } finally {
      setSendingLink(false);
    }
  };

  const handleStartSession = async (appointment) => {
    try {
      await axios.post(`/api/appointments/${appointment._id}/start-session`);
      
      // Open the meeting link
      if (appointment.meetingLink) {
        window.open(appointment.meetingLink, '_blank');
      }
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Please try again.');
    }
  };

  const handleEndSession = async (appointment) => {
    try {
      await axios.post(`/api/appointments/${appointment._id}/end-session`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session. Please try again.');
    }
  };

  const copyMeetingLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Counselor Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {counselor?.firstName} {counselor?.lastName}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards - Same as before */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sessions */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between h-full">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
            <button
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              onClick={() => setIsCalendarOpen(true)}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              View Schedule
            </button>
          </div>

          {/* Other stats cards remain the same... */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)} ⭐</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingSessions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Section - Same as before */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Earnings Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">${earnings.total}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">${earnings.thisMonth}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-purple-600">${earnings.thisWeek}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button 
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                onClick={() => setIsCalendarOpen(true)}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                View Schedule
              </button>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
              </button>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* All Appointments Section with Pagination */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">All Appointments</h2>
              
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                {/* Session Type Filter */}
                <select
                  value={sessionTypeFilter}
                  onChange={(e) => setSessionTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="chat">Chat</option>
                  <option value="video">Video</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Link</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {appointment.client?.firstName?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.client?.firstName || 'Client'} {appointment.client?.lastName || ''}
                          </div>
                          <div className="text-sm text-gray-500">{appointment.client?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(appointment.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{appointment.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{appointment.sessionType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.meetingLink ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyMeetingLink(appointment.meetingLink)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="Copy meeting link"
                          >
                            Copy Link
                          </button>
                          <button
                            onClick={() => window.open(appointment.meetingLink, '_blank')}
                            className="text-green-600 hover:text-green-800"
                            title="Open meeting"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Shared</span>
                        </div>
                      ) : appointment.sessionType === 'video' ? (
                        <span className="text-gray-400 text-xs">No link shared</span>
                      ) : (
                        <span className="text-gray-400 text-xs">In-person</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* Action buttons based on session type and status */}
                      {appointment.sessionType === 'chat' && (
                        <Link to={`/counselor/session/${appointment._id}`}>
                          <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mr-2">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Chat
                          </button>
                        </Link>
                      )}
                      
                      {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && appointment.sessionType === 'video' && !appointment.meetingLink && (
                        <button
                          onClick={() => handleStartVideoCall(appointment)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mr-2"
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Create Meet
                        </button>
                      )}
                      
                      {appointment.meetingLink && appointment.status === 'confirmed' && (
                        <button
                          onClick={() => handleStartSession(appointment)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors mr-2"
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Start Session
                        </button>
                      )}

                      {appointment.status === 'in-progress' && appointment.sessionType === 'video' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => window.open(appointment.meetingLink, '_blank')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            <Video className="h-3 w-3 mr-1" />
                            Join Meet
                          </button>
                          <button
                            onClick={() => handleEndSession(appointment)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 transition-colors"
                          >
                            End Session
                          </button>
                        </div>
                      )}

                      {appointment.status === 'completed' && (
                        <span className="text-green-600 text-xs">Completed</span>
                      )}
                      {appointment.status === 'cancelled' && (
                        <span className="text-red-600 text-xs">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Showing {indexOfFirstAppointment + 1} to {Math.min(indexOfLastAppointment, filteredAppointments.length)} of {filteredAppointments.length} appointments
                  </div>
                  {/* Page Size Selector */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                      value={appointmentsPerPage}
                      onChange={(e) => {
                        setAppointmentsPerPage(Number(e.target.value));
                        setCurrentPage(1); // Reset to first page when changing page size
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </select>
                    <span className="text-sm text-gray-600">per page</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Previous Page Button */}
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, index) => {
                      const pageNumber = index + 1;
                      // Show first page, last page, current page, and pages around current page
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  {/* Go to Page Input */}
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-sm text-gray-600">Go to:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          paginate(page);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= totalPages) {
                            paginate(page);
                          }
                        }
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-600">of {totalPages}</span>
                  </div>
                  
                  {/* Next Page Button */}
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Meeting Link Modal */}
        {showMeetingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Share Meeting Link</h2>
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Session with: <span className="font-semibold">{selectedAppointment?.client?.firstName} {selectedAppointment?.client?.lastName}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Google Meet should have opened in a new tab. Create your meeting and paste the link below.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Meet Link
                  </label>
                  <input
                    type="text"
                    value={meetingLinkInput}
                    onChange={(e) => setMeetingLinkInput(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSendMeetingLink}
                    disabled={sendingLink || !meetingLinkInput.trim()}
                    className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
                      sendingLink || !meetingLinkInput.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    {sendingLink ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send to Client
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowMeetingModal(false)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700">
                    <strong>Instructions:</strong>
                    <br />1. A new tab with Google Meet should have opened
                    <br />2. Click "New meeting" and then "Start an instant meeting"
                    <br />3. Copy the meeting link from the browser URL
                    <br />4. Paste it above and click "Send to Client"
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Modal - Same as before */}
        {isCalendarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-md w-full mx-4">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl font-bold"
                onClick={() => setIsCalendarOpen(false)}
              >
                &times;
              </button>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Your Appointments Schedule</h3>
              <Calendar
                tileClassName={({ date, view }) => {
                  const isAppointment = appointments.some(apt =>
                    new Date(apt.date).toDateString() === date.toDateString()
                  );
                  return isAppointment ? 'bg-blue-200 text-blue-900 rounded-full font-bold' : null;
                }}
                className="w-full"
              />
              <div className="mt-4 text-xs text-gray-500 text-center">
                <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-2"></span>
                Blue dates = Appointment scheduled
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
