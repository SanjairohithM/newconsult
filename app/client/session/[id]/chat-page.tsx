"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Clock, User, FileText } from "lucide-react"
import ClientLayout from "@/components/client-layout"
import { useToast } from "@/hooks/use-toast"

interface Message {
  _id: string
  content: string
  sender: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  receiver: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  createdAt: string
  isRead: boolean
}

interface Appointment {
  _id: string
  client: string
  counselor: {
    _id: string
    firstName: string
    lastName: string
    specialization: string
    avatar?: string
  }
  date: string
  time: string
  duration: number
  sessionType: string
  status: string
  notes: string
  amount: number
  paymentStatus: string
}

export default function ChatSessionPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchAppointment()
    fetchMessages()
    setSessionStartTime(new Date())
  }, [params.id])

  useEffect(() => {
    // Session timer
    let interval: NodeJS.Timeout
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchAppointment = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to access this session",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/appointments/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAppointment(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch appointment details",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching appointment:", error)
      toast({
        title: "Error",
        description: "Failed to fetch appointment details",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`/api/messages/appointment/${params.id}`, {
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

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: params.id,
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
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
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
          appointmentId: params.id
        })
      })
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatMessageTime = (timestamp: string) => {
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

  const isClient = true // This page is for clients
  const counselorName = `${appointment.counselor.firstName} ${appointment.counselor.lastName}`

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Session Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={appointment.counselor.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {appointment.counselor.firstName[0]}{appointment.counselor.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">{counselorName}</h1>
                  <p className="text-gray-600">{appointment.counselor.specialization}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="default" className="mb-2">
                  Chat Session
                </Badge>
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
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat Session with {counselorName}
                </CardTitle>
                <CardDescription>
                  Duration: {appointment.duration} minutes • Status: {appointment.status}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full p-0">
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
                        className={`flex ${message.sender._id === appointment.client ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                          {message.sender._id !== appointment.client && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {message.sender.firstName[0]}{message.sender.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              message.sender._id === appointment.client
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender._id === appointment.client 
                                ? "text-blue-100" 
                                : "text-gray-500"
                            }`}>
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                          {message.sender._id === appointment.client && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder-user.jpg" />
                              <AvatarFallback>You</AvatarFallback>
                            </Avatar>
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
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Info Sidebar */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Counselor</p>
                    <p className="text-sm text-gray-600">{counselorName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-gray-600">{appointment.duration} minutes</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-sm text-gray-600">
                      {appointment.notes || "No notes provided"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-2">Session Status</p>
                  <Badge variant={appointment.status === "completed" ? "secondary" : "default"}>
                    {appointment.status}
                  </Badge>
                </div>

                {appointment.paymentStatus && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-900 mb-2">Payment Status</p>
                    <Badge variant={appointment.paymentStatus === "paid" ? "default" : "secondary"}>
                      {appointment.paymentStatus}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
