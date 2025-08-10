import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { MessageCircle, Calendar, Clock, User, Search, Filter } from "lucide-react"
import ClientLayout from "../../components/ClientLayout"

const MessagesPage = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sessionTypeFilter, setSessionTypeFilter] = useState("all")

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await axios.get("/api/appointments")
      setAppointments(response.data)
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter appointments based on search and filters
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = searchQuery === "" || 
      apt.counselor?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.counselor?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.counselor?.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter
    const matchesSessionType = sessionTypeFilter === "all" || apt.sessionType === sessionTypeFilter
    
    return matchesSearch && matchesStatus && matchesSessionType
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSessionTypeIcon = (sessionType) => {
    switch (sessionType) {
      case "chat":
        return <MessageCircle className="h-5 w-5 text-blue-600" />
      case "video":
        return <Calendar className="h-5 w-5 text-green-600" />
      case "in-person":
        return <User className="h-5 w-5 text-purple-600" />
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages & Sessions</h1>
              <p className="text-gray-600 mt-2">View and manage your counseling sessions</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/client/book-appointment"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book New Session
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search counselors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="chat">Chat</option>
              <option value="video">Video</option>
              <option value="in-person">In-Person</option>
            </select>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              All Sessions ({filteredAppointments.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter !== "all" || sessionTypeFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "You haven't booked any sessions yet"}
                </p>
                {!searchQuery && statusFilter === "all" && sessionTypeFilter === "all" && (
                  <Link
                    to="/client/book-appointment"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Book Your First Session
                  </Link>
                )}
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">
                          {appointment.counselor?.firstName?.[0] || "C"}
                          {appointment.counselor?.lastName?.[0] || ""}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {appointment.counselor?.firstName} {appointment.counselor?.lastName}
                        </h3>
                        <p className="text-gray-600">{appointment.counselor?.specialization}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {new Date(appointment.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{appointment.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {/* Session Type Badge */}
                      <div className="flex items-center space-x-2">
                        {getSessionTypeIcon(appointment.sessionType)}
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {appointment.sessionType}
                        </span>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      
                      {/* Action Button */}
                      {appointment.sessionType === "chat" ? (
                        <Link to={`/session/${appointment._id}`}>
                          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {appointment.status === "completed" ? "View Chat" : "Start Chat"}
                          </button>
                        </Link>
                      ) : appointment.sessionType === "video" ? (
                        appointment.meetingLink ? (
                          <button
                            onClick={() => window.open(appointment.meetingLink, "_blank")}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Join Meeting
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">Waiting for meeting link</span>
                        )
                      ) : (
                        <Link to={`/session/${appointment._id}`}>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                            View Details
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}

export default MessagesPage
