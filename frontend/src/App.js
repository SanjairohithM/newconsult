import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "./contexts/AuthContext"
import { SocketProvider } from "./contexts/SocketContext"

// Components
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/auth/LoginPage"
import RegisterPage from "./pages/auth/RegisterPage"
import ClientDashboard from "./pages/client/ClientDashboard"
import CounselorDashboard from "./pages/counselor/CounselorDashboard"
import CounselorSessionPage from "./pages/counselor/CounselorSessionPage"
import BookAppointment from "./pages/client/BookAppointment"
import MessagesPage from "./pages/client/MessagesPage"
import SessionPage from "./pages/SessionPage"
import PaymentsPage from "./pages/client/PaymentsPage"
import ProtectedRoute from "./components/ProtectedRoute"

// Styles
import "./index.css"

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Toaster position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Client Routes */}
              <Route
                path="/client/dashboard"
                element={
                  <ProtectedRoute userType="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/book-appointment"
                element={
                  <ProtectedRoute userType="client">
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/payments"
                element={
                  <ProtectedRoute userType="client">
                    <PaymentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/messages"
                element={
                  <ProtectedRoute userType="client">
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />

              {/* Counselor Routes */}
              <Route
                path="/counselor/dashboard"
                element={
                  <ProtectedRoute userType="counselor">
                    <CounselorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/counselor/session/:id"
                element={
                  <ProtectedRoute userType="counselor">
                    <CounselorSessionPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Routes */}
              <Route
                path="/session/:id"
                element={
                  <ProtectedRoute>
                    <SessionPage />
                  </ProtectedRoute>
                }
              />

              {/* Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
