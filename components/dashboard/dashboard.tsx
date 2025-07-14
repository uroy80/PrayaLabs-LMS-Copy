"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, User, Calendar, Search, LogOut, Settings } from "lucide-react"
import { BookSearch } from "./book-search"
import { UserProfile } from "./user-profile"
import { BorrowedBooks } from "./borrowed-books"
import { Reservations } from "./reservations"
import { ApiConfigDebug } from "@/components/debug/api-config-debug"
import { ENV } from "@/lib/config"

export function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("search")

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-900 rounded-lg sm:rounded-xl shadow-lg mr-2 sm:mr-4 border border-blue-800">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                {/* Show LMS on mobile, full title on desktop */}
                <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                  <span className="block sm:hidden">LMS</span>
                  <span className="hidden sm:block">Library Management System</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-700 font-bold hidden sm:block">Digital Library Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600 font-bold">ID: {user?.uid}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors-smooth shadow-soft text-xs sm:text-sm px-2 sm:px-4 font-bold"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-8">
          <div className="flex justify-center">
            <TabsList className="inline-flex h-10 sm:h-12 items-center justify-center rounded-lg sm:rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-gray-200 p-1 text-muted-foreground w-full max-w-2xl overflow-x-auto font-bold">
              <TabsTrigger 
                value="search" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1 sm:gap-2 flex-1 sm:flex-initial"
              >
                <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Search Books</span>
                <span className="sm:hidden">Search</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1 sm:gap-2 flex-1 sm:flex-initial"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Profile</span>
                <span className="sm:hidden">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="borrowed" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1 sm:gap-2 flex-1 sm:flex-initial"
              >
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Borrowed</span>
                <span className="sm:hidden">Books</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reservations" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1 sm:gap-2 flex-1 sm:flex-initial"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Reservations</span>
                <span className="sm:hidden">Reserved</span>
            </TabsTrigger>
            {ENV.IS_DEVELOPMENT && (
                <TabsTrigger 
                  value="debug" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1 sm:gap-2 flex-1 sm:flex-initial"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Debug</span>
                  <span className="sm:hidden">Debug</span>
                </TabsTrigger>
            )}
            </TabsList>
          </div>

          <TabsContent value="search" className="space-y-4 sm:space-y-8 animate-slide-up">
            <div className="text-center space-y-2 sm:space-y-4">
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Search Library Books</h2>
              <p className="text-sm sm:text-lg text-gray-700 font-bold max-w-2xl mx-auto px-4">Find and reserve books from our comprehensive digital collection</p>
            </div>
            <div>
              <BookSearch />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 sm:space-y-8 animate-slide-up">
            <div className="text-center space-y-2 sm:space-y-4">
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">My Profile</h2>
              <p className="text-sm sm:text-lg text-gray-700 font-bold max-w-2xl mx-auto px-4">View your account information and library statistics</p>
            </div>
            <div>
              <UserProfile />
            </div>
          </TabsContent>

          <TabsContent value="borrowed" className="space-y-4 sm:space-y-8 animate-slide-up">
            <div className="text-center space-y-2 sm:space-y-4">
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Borrowed Books</h2>
              <p className="text-sm sm:text-lg text-gray-700 font-bold max-w-2xl mx-auto px-4">Manage your currently borrowed books and due dates</p>
            </div>
            <div>
              <BorrowedBooks />
            </div>
          </TabsContent>

          <TabsContent value="reservations" className="space-y-4 sm:space-y-8 animate-slide-up">
            <div className="text-center space-y-2 sm:space-y-4">
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">My Reservations</h2>
              <p className="text-sm sm:text-lg text-gray-700 font-bold max-w-2xl mx-auto px-4">View and manage your book reservations and requests</p>
            </div>
            <div>
              <Reservations />
            </div>
          </TabsContent>
          {ENV.IS_DEVELOPMENT && (
            <TabsContent value="debug" className="space-y-4 sm:space-y-8 animate-slide-up">
              <div className="text-center space-y-2 sm:space-y-4">
                <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Debug Information</h2>
                <p className="text-sm sm:text-lg text-gray-700 font-bold max-w-2xl mx-auto px-4">Development tools and API configuration</p>
              </div>
              <div>
                <ApiConfigDebug />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}

export default Dashboard
