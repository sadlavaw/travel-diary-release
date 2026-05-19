import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TripsProvider } from './context/TripsContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import TripDetailPage from './pages/TripDetailPage'
import TripFormPage from './pages/TripFormPage'
import ProfilePage from './pages/ProfilePage'
import ExplorePage from './pages/ExplorePage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

function AppLayout() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/trips/new" element={<PrivateRoute><TripFormPage /></PrivateRoute>} />
          <Route path="/trips/:id/edit" element={<PrivateRoute><TripFormPage /></PrivateRoute>} />
          <Route path="/trips/:id" element={<PrivateRoute><TripDetailPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/profile/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/explore" element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TripsProvider>
          <AppLayout />
        </TripsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
