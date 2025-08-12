"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import API_BASE_URL from "../../config/api"
import { Calendar, Video, MessageCircle, Clock, Star, Plus, Search, X, MapPin, Copy, ChevronLeft, ChevronRight } from "lucide-react"
import ClientLayout from "../../components/ClientLayout"

const ClientDashboard = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [counselors, setCounselors] = useState([])
  const [filteredCounselors, setFilteredCounselors] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Pagination state for upcoming appointments
  const [currentPage, setCurrentPage] = useState(1)
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(5)

  useEffect(() => {
    fetchAppointments()
    
    // Set up polling to check for meeting links every 30 seconds
    const interval = setInterval(() => {
      fetchAppointments()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Reset to first page when appointments change
  useEffect(() => {
    setCurrentPage(1)
  }, [appointments.length])

  useEffect(() => {
    if (isSearchOpen && counselors.length === 0) {
      fetchCounselors()
    }
  }, [isSearchOpen, counselors.length])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCounselors(counselors)
    } else {
      const filtered = counselors.filter(counselor =>
        counselor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        counselor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        counselor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        counselor.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredCounselors(filtered)
    }
  }, [searchQuery, counselors])

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/appointments`)
      setAppointments(response.data)
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCounselors = async () => {
    setSearchLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/counselors`)
      setCounselors(response.data)
      setFilteredCounselors(response.data)
    } catch (error) {
      console.error("Error fetching counselors:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  const copyMeetingLink = (link) => {
    navigator.clipboard.writeText(link)
    alert('Meeting link copied to clipboard!')
  }

  const joinMeeting = (meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, '_blank')
    } else {
      alert('Meeting link not available yet. Please wait for your counselor to start the session.')
    }
  }

  const upcomingAppointments = appointments.filter((apt) => {
    if (apt.status !== "scheduled" && apt.status !== "confirmed") return false
    
    const appointmentDate = new Date(apt.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of today
    
    // Include appointments from today onwards (today and future)
    return appointmentDate >= today
  })

  const recentSessions = appointments.filter((apt) => apt.status === "completed").slice(0, 3)

  // Pagination logic for upcoming appointments
  const indexOfLastAppointment = currentPage * appointmentsPerPage
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage
  const currentAppointments = upcomingAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment)
  const totalPages = Math.ceil(upcomingAppointments.length / appointmentsPerPage)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
          <p className="text-blue-100">You have {upcomingAppointments.length} upcoming appointments this week.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/client/book-appointment">
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h3 className="ml-2 text-lg font-semibold">Book Appointment</h3>
              </div>
              <p className="text-sm text-gray-600">Schedule a session with a counselor</p>
            </div>
          </Link>

          <Link to="/client/messages">
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <MessageCircle className="h-6 w-6 text-green-600" />
                <h3 className="ml-2 text-lg font-semibold">Messages</h3>
              </div>
              <p className="text-sm text-gray-600">Chat with your counselors</p>
            </div>
          </Link>

          <div 
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setIsSearchOpen(true)}
          >
            <div className="flex items-center mb-4">
              <Search className="h-6 w-6 text-purple-600" />
              <h3 className="ml-2 text-lg font-semibold">Find Counselors</h3>
            </div>
            <p className="text-sm text-gray-600">Browse available counselors</p>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Calendar className="h-5 w-5 mr-2" />
            <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
          </div>

          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {currentAppointments.map((appointment) => (
                <div key={appointment._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {appointment.counselor?.firstName?.[0]}
                        {appointment.counselor?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        Dr. {appointment.counselor?.firstName} {appointment.counselor?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{appointment.counselor?.specialization}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </span>
                      </div>
                      {/* Meeting Link Status */}
                      {appointment.sessionType === 'video' && (
                        <div className="mt-2">
                          {appointment.meetingLink ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                Meeting Ready
                              </span>
                              <button
                                onClick={() => copyMeetingLink(appointment.meetingLink)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                <Copy className="h-3 w-3 inline mr-1" />
                                Copy Link
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                              Waiting for counselor to start
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {appointment.sessionType}
                    </span>
                    {appointment.sessionType === 'video' ? (
                      <button 
                        onClick={() => joinMeeting(appointment.meetingLink)}
                        className={`px-4 py-2 rounded-md text-sm flex items-center ${
                          appointment.meetingLink 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-gray-400 text-white cursor-not-allowed'
                        }`}
                        disabled={!appointment.meetingLink}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        {appointment.meetingLink ? 'Join Meeting' : 'Waiting...'}
                      </button>
                    ) : appointment.sessionType === 'chat' ? (
                      <Link to={`/session/${appointment._id}`}>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Start Chat
                        </button>
                      </Link>
                    ) : (
                      <Link to={`/session/${appointment._id}`}>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
                          <Calendar className="h-4 w-4 mr-1 inline" />
                          View Details
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      Showing {indexOfFirstAppointment + 1} to {Math.min(indexOfLastAppointment, upcomingAppointments.length)} of {upcomingAppointments.length} appointments
                    </div>
                    {/* Page Size Selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Show:</span>
                      <select
                        value={appointmentsPerPage}
                        onChange={(e) => {
                          setAppointmentsPerPage(Number(e.target.value))
                          setCurrentPage(1) // Reset to first page when changing page size
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
                        const pageNumber = index + 1
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
                          )
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return <span key={pageNumber} className="px-2 text-gray-400">...</span>
                        }
                        return null
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
                          const page = parseInt(e.target.value)
                          if (page >= 1 && page <= totalPages) {
                            paginate(page)
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const page = parseInt(e.target.value)
                            if (page >= 1 && page <= totalPages) {
                              paginate(page)
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
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming appointments</p>
              <Link to="/client/book-appointment">
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                  <Plus className="h-4 w-4 mr-2 inline" />
                  Book Your First Session
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Sessions</h2>

          {recentSessions.length > 0 ? (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      Dr. {session.counselor?.firstName} {session.counselor?.lastName}
                    </h3>
                    <div className="flex items-center">
                      {session.rating &&
                        [...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < session.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                    <span>{session.duration} minutes</span>
                    <span className="capitalize">{session.sessionType}</span>
                  </div>
                  {session.feedback && <p className="text-sm text-gray-700">{session.feedback}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sessions yet</p>
            </div>
          )}
        </div>

        {/* Search Counselors Modal - Rest of your existing modal code stays the same */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Find Counselors</h2>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 border-b bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by name, specialization, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCounselors.length > 0 ? (
                      filteredCounselors.map((counselor) => (
                        <div key={counselor._id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-lg">
                                {counselor.firstName?.[0]}{counselor.lastName?.[0]}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Dr. {counselor.firstName} {counselor.lastName}
                                </h3>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span className="text-sm text-gray-600">{counselor.rating || 4.5}</span>
                                </div>
                              </div>
                              <p className="text-blue-600 font-medium mb-1">{counselor.specialization}</p>
                              <p className="text-sm text-gray-600 mb-2">{counselor.bio || "Experienced counselor dedicated to helping clients achieve their goals."}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>${counselor.hourlyRate || 100}/hour</span>
                                  <span>{counselor.experience || "5+ years"} experience</span>
                                  {counselor.location && (
                                    <div className="flex items-center">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      <span>{counselor.location}</span>
                                    </div>
                                  )}
                                </div>
                                <Link to={`/client/counselor/${counselor._id}`}>
                                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
                                    View Profile
                                  </button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          {searchQuery ? "No counselors found matching your search." : "Start typing to search for counselors..."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {filteredCounselors.length} counselor{filteredCounselors.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  )
}

export default ClientDashboard
