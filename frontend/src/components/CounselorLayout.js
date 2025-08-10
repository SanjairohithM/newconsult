import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { 
  Calendar, 
  MessageCircle, 
  Settings, 
  LogOut, 
  Home,
  Menu,
  X
} from "lucide-react"

const CounselorLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [counselor, setCounselor] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const fetchCounselorProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCounselor(data)
      } else {
        navigate("/login")
      }
    } catch (error) {
      console.error("Error fetching counselor profile:", error)
      navigate("/login")
    }
  }

  useEffect(() => {
    fetchCounselorProfile()
  }, [fetchCounselorProfile])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userType")
    navigate("/login")
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const navigation = [
    { name: "Dashboard", href: "/counselor/dashboard", icon: Home },
    { name: "Messages", href: "/counselor/messages", icon: MessageCircle },
    { name: "Schedule", href: "/counselor/schedule", icon: Calendar },
    { name: "Settings", href: "/counselor/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Counselor Portal</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Counselor Profile */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">
                {counselor?.firstName?.[0] || "C"}
                {counselor?.lastName?.[0] || ""}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Dr. {counselor?.firstName} {counselor?.lastName}
              </p>
              <p className="text-xs text-gray-500">{counselor?.specialization}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-6 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome back, Dr. {counselor?.firstName} {counselor?.lastName}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default CounselorLayout
