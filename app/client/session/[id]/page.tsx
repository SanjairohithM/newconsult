"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Calendar, MessageCircle, Video, Phone, AlertCircle } from "lucide-react"
import ClientLayout from "@/components/client-layout"
import { useToast } from "@/hooks/use-toast"

interface Appointment {
  _id: string
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

export default function SessionPagePlaceholder({ params }: { params: { id: string } }) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchAppointment()
  }, [params.id])

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

  const counselorName = `${appointment.counselor.firstName} ${appointment.counselor.lastName}`
  const isChatSession = appointment.sessionType === "chat"

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
                  <h1 className="text-xl font-bold">Session with {counselorName}</h1>
                  <p className="text-gray-600">{appointment.counselor.specialization} Counselor</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="default" className="mb-2">
                  {isChatSession ? "Chat Session" : "Video Session"}
                </Badge>
                <p className="text-sm text-gray-600">
                  {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Session Area */}
          <div className="lg:col-span-2">
            <Card className="h-[500px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {isChatSession ? (
                    <MessageCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <Video className="h-5 w-5 mr-2" />
                  )}
                  {isChatSession ? "Chat Session" : "Video Session"}
                </CardTitle>
                <CardDescription>
                  Session will begin at the scheduled time
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-full p-8">
                <div className="text-center space-y-4">
                  {isChatSession ? (
                    <MessageCircle className="h-24 w-24 mx-auto text-blue-500" />
                  ) : (
                    <Video className="h-24 w-24 mx-auto text-green-500" />
                  )}
                  
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isChatSession ? "Chat Session" : "Video Session"} Coming Soon
                  </h2>
                  
                  <p className="text-gray-600 max-w-md">
                    {isChatSession 
                      ? "Your chat session will be available here. You'll be able to send and receive messages with your counselor."
                      : "Your video session will be available here. You'll be able to join the video call with your counselor."
                    }
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
              </CardContent>
            </Card>
          </div>

          {/* Session Info Sidebar */}
          <div className="space-y-4">
            {/* Counselor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Counselor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Badge variant={isChatSession ? "default" : "secondary"}>
                    {isChatSession ? "Chat" : "Video Call"}
                  </Badge>
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

            {/* Session Notes */}
            {appointment.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{appointment.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  <Calendar className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
