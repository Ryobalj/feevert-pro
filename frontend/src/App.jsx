import React from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/common/ScrollToTop'
import ProtectedRoute from './routes/ProtectedRoute'

// Landing Page
import LandingPage from './features/home/pages/LandingPage'

// Home Page
import HomePage from './features/home/pages/HomePage'

// Other Pages
import AboutPage from './features/home/pages/AboutPage'
import ServicesPage from './features/home/pages/ServicesPage'
import ServiceDetailPage from './features/home/pages/ServiceDetailPage'
import ContactPage from './features/home/pages/ContactPage'
import PartnersPage from './features/home/pages/PartnersPage'
import FaqPage from './features/home/pages/FaqPage'

// Accounts
import LoginPage from './features/accounts/pages/LoginPage'
import RegisterPage from './features/accounts/pages/RegisterPage'
import ProfilePage from './features/accounts/pages/ProfilePage'
import Dashboard from './features/accounts/pages/Dashboard'
import SettingsPage from './features/accounts/pages/SettingsPage'
import ForgotPassword from './features/accounts/pages/ForgotPassword'
import ResetPassword from './features/accounts/pages/ResetPassword'
import VerifyEmailPage from './features/accounts/pages/VerifyEmailPage'

// Consultations
import ConsultationList from './features/consultations/pages/ConsultationList'
import ConsultationDetail from './features/consultations/pages/ConsultationDetail'
import RequestConsultation from './features/consultations/pages/RequestConsultation'

// Bookings
import MyBookings from './features/bookings/pages/MyBookings'
import BookingDetail from './features/bookings/pages/BookingDetail'
import BookingPage from './features/bookings/pages/BookingPage'

// Projects
import ProjectList from './features/projects/pages/ProjectList'
import ProjectDetail from './features/projects/pages/ProjectDetail'

// Careers
import JobList from './features/careers/pages/JobList'
import JobDetail from './features/careers/pages/JobDetail'

// News
import NewsList from './features/news/pages/NewsList'
import NewsDetail from './features/news/pages/NewsDetail'

// Team
import TeamList from './features/team/pages/TeamList'
import TeamMemberDetail from './features/team/pages/TeamMemberDetail'

// Reviews
import ReviewList from './features/reviews/pages/ReviewList'

// Payments
import PaymentHistory from './features/payments/pages/PaymentHistory'
import PaymentPage from './features/payments/pages/PaymentPage'

// Notifications
import NotificationList from './features/notifications/pages/NotificationList'

function App() {
  const location = useLocation()
  const hideNavbar = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <ScrollToTop />
      {!hideNavbar && <Navbar />}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes - No Auth Required */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/reviews" element={<ReviewList />} />
            
            {/* Services */}
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:id" element={<ServiceDetailPage />} />
            
            {/* Projects */}
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            
            {/* Team */}
            <Route path="/team" element={<TeamList />} />
            <Route path="/team/:id" element={<TeamMemberDetail />} />
            
            {/* Careers */}
            <Route path="/careers" element={<JobList />} />
            <Route path="/careers/:id" element={<JobDetail />} />
            
            {/* News */}
            <Route path="/news" element={<NewsList />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            
            {/* Auth - Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            
            {/* Protected Routes - Require Authentication */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            {/* Consultations */}
            <Route path="/consultations" element={
              <ProtectedRoute>
                <ConsultationList />
              </ProtectedRoute>
            } />
            <Route path="/consultations/:id" element={
              <ProtectedRoute>
                <ConsultationDetail />
              </ProtectedRoute>
            } />
            <Route path="/request-consultation" element={
              <ProtectedRoute>
                <RequestConsultation />
              </ProtectedRoute>
            } />
            
            {/* Bookings */}
            <Route path="/my-bookings" element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            } />
            <Route path="/bookings/:id" element={
              <ProtectedRoute>
                <BookingDetail />
              </ProtectedRoute>
            } />
            <Route path="/book-appointment" element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            } />
            
            {/* Payments */}
            <Route path="/payment-history" element={
              <ProtectedRoute>
                <PaymentHistory />
              </ProtectedRoute>
            } />
            <Route path="/payment" element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            } />
            
            {/* Notifications */}
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationList />
              </ProtectedRoute>
            } />
            
            {/* 404 - Catch all */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">404</h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Page not found</p>
                  <Link to="/home" className="text-green-600 dark:text-green-400 hover:underline">
                    Go Home
                  </Link>
                </div>
              </div>
            } />
          </Routes>
        </AnimatePresence>
      </main>
      {!hideNavbar && <Footer />}
      
      {/* Floating components removed - Chat and Support now in User Dropdown Menu */}
    </div>
  )
}

export default App