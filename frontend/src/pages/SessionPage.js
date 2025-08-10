import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Calendar, Video, MessageCircle, Clock, User, Phone, AlertCircle, Send } from "lucide-react"
import ClientLayout from "../components/ClientLayout"
import { useSocket } from "../contexts/SocketContext"

export default function SessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const messagesEndRef = useRef(null)
  const { socket, joinSession, sendMessage: socketSendMessage } = useSocket()

  useEffect(() => {
    fetchAppointment()
    fetchMessages()
    setSessionStartTime(new Date())
  }, [id])

  useEffect(() => {
    // Session timer
    let interval
    if (sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [sessionStartTime])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Socket.IO event listeners
  useEffect(() => {
    if (socket && appointment) {
      // Join the chat session
      joinSession(id)

      // Listen for incoming messages
      socket.on("receive-message", (message) => {
        setMessages(prev => [...prev, message])
        // Mark messages as read
        markMessagesAsRead()
      })

      return () => {
        socket.off("receive-message")
      }
    }
  }, [socket, appointment, id, joinSession])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchAppointment = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Please log in to access this session")
        navigate("/login")
        return
      }

      const response = await fetch(`/api/appointments/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAppointment(data)
      } else {
        alert("Failed to fetch appointment details")
      }
    } catch (error) {
      console.error("Error fetching appointment:", error)
      alert("Failed to fetch appointment details")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`/api/messages/appointment/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !appointment) return

    try {
      const token = localStorage.getItem("token")
      if (!token) return

      // Send message via Socket.IO for real-time delivery
      if (socket) {
        socketSendMessage(id, {
          content: newMessage.trim(),
          messageType: "text"
        })
      }

      // Also save to database
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: id,
          content: newMessage.trim(),
          messageType: "text"
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.data])
        setNewMessage("")
        
        // Mark messages as read
        markMessagesAsRead()
      } else {
        alert("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
    }
  }

  const markMessagesAsRead = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      await fetch("/api/messages/read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: id
        })
      })
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ClientLayout>
    )
  }

  if (!appointment) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment Not Found</h1>
            <p className="text-gray-600">The appointment you're looking for doesn't exist.</p>
          </div>
        </div>
      </ClientLayout>
    )
  }

  const counselorName = `${appointment.counselor?.firstName || 'Unknown'} ${appointment.counselor?.lastName || 'Counselor'}`
  const isChatSession = appointment.sessionType === "chat"

  // If it's not a chat session, show the original placeholder
  if (!isChatSession) {
    return (
      <ClientLayout>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Session Header */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {counselorName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Session with {counselorName}</h1>
                  <p className="text-gray-600">{appointment.counselor?.specialization || 'Counseling'} Counselor</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 bg-green-100 text-green-800">
                  Video Session
                </span>
                <p className="text-sm text-gray-600">
                  {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Session Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg h-[500px]">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Video className="h-5 w-5 mr-2 text-green-500" />
                    Video Session
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Session will begin at the scheduled time
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="text-center space-y-4">
                    <Video className="h-24 w-24 mx-auto text-green-500" />
                    
                    <h2 className="text-2xl font-bold text-gray-900">
                      Video Session Coming Soon
                    </h2>
                    
                    <p className="text-gray-600 max-w-md">
                      Your video session will be available here. You'll be able to join the video call with your counselor.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Session Status: {appointment.status}</p>
                          <p>Please wait for the session to begin at {appointment.time}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Info Sidebar */}
            <div className="space-y-4">
              {/* Counselor Info */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Counselor Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Counselor Name</p>
                      <p className="text-sm text-gray-600">{counselorName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Appointment Date</p>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-gray-600">{appointment.duration} minutes</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-900 mb-2">Session Type</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Video Call
                    </span>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-900 mb-2">Session Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.status === "completed" 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>

                  {appointment.paymentStatus && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-900 mb-2">Payment Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.paymentStatus === "paid" 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.paymentStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Notes */}
              {appointment.notes && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Session Notes</h3>
                  <p className="text-sm text-gray-600">{appointment.notes}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed flex items-center justify-center"
                    disabled
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Support
                  </button>
                  <button 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed flex items-center justify-center"
                    disabled
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ClientLayout>
    )
  }

  // Chat Session UI
  return (
    <ClientLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Session Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">
                  {counselorName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Chat Session with {counselorName}</h1>
                <p className="text-gray-600">{appointment.counselor?.specialization || 'Counseling'} Counselor</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 bg-blue-100 text-blue-800">
                Chat Session
              </span>
              <p className="text-sm text-gray-600">
                {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
              </p>
              {sessionStartTime && (
                <p className="text-sm font-mono text-blue-600">
                  Session Time: {formatTime(sessionDuration)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg h-[600px]">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
                  Chat Session with {counselorName}
                </h2>
                <p className="text-gray-600 text-sm">
                  Duration: {appointment.duration} minutes • Status: {appointment.status}
                </p>
              </div>
              <div className="flex flex-col h-full p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.sender._id === appointment.client?._id ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                          {message.sender._id !== appointment.client?._id && (
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-bold">
                                {counselorName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          )}
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              message.sender._id === appointment.client?._id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender._id === appointment.client?._id 
                                ? "text-blue-100" 
                                : "text-gray-500"
                            }`}>
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                          {message.sender._id === appointment.client?._id && (
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 text-xs font-bold">You</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      onClick={sendMessage} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Info Sidebar */}
          <div className="space-y-4">
            {/* Counselor Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Counselor Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Counselor Name</p>
                    <p className="text-sm text-gray-600">{counselorName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Appointment Date</p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-gray-600">{appointment.duration} minutes</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-2">Session Type</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Chat
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-2">Session Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.status === "completed" 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>

                {appointment.paymentStatus && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-900 mb-2">Payment Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.paymentStatus === "paid" 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.paymentStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Session Notes */}
            {appointment.notes && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Session Notes</h3>
                <p className="text-sm text-gray-600">{appointment.notes}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed flex items-center justify-center"
                  disabled
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </button>
                <button 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed flex items-center justify-center"
                  disabled
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}