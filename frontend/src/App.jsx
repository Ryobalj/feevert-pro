import React from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/common/ScrollToTop'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute from './routes/AdminRoute'

// Landing Page
import LandingPage from './features/home/pages/LandingPage'

// Home Page
import HomePage from './features/home/pages/HomePage'

// Other Pages
import AboutPage from './features/home/pages/AboutPage'
import ServiceDetailPage from './features/home/pages/ServiceDetailPage'
import CategoryDetailPage from './features/home/pages/CategoryDetailPage'
import ContactPage from './features/home/pages/ContactPage'
import PartnersPage from './features/home/pages/PartnersPage'
import FaqPage from './features/home/pages/FaqPage'

// Accounts
import LoginPage from './features/accounts/pages/LoginPage'
import RegisterPage from './features/accounts/pages/RegisterPage'
import ProfilePage from './features/accounts/pages/ProfilePage'
import Dashboard from './features/accounts/pages/Dashboard'
import MessagesPage from './features/realtime/pages/MessagesPage'
import EmailInboxPage from './features/notifications/pages/EmailInboxPage'
import AdminEmailAccountsPage from './features/notifications/pages/AdminEmailAccountsPage'
import SettingsPage from './features/accounts/pages/SettingsPage'
import ForgotPassword from './features/accounts/pages/ForgotPassword'
import ResetPassword from './features/accounts/pages/ResetPassword'
import VerifyEmailPage from './features/accounts/pages/VerifyEmailPage'
import AdminUsersPage from './features/accounts/pages/AdminUsersPage'
import AdminRolesPage from './features/accounts/pages/AdminRolesPage'
import AdminSettingsPage from './features/accounts/pages/AdminSettingsPage'

// Consultations
import ConsultationList from './features/consultations/pages/ConsultationList'
import ConsultationDetail from './features/consultations/pages/ConsultationDetail'
import RequestConsultation from './features/consultations/pages/RequestConsultation'

// Bookings
import MyBookings from './features/bookings/pages/MyBookings'
import BookingDetail from './features/bookings/pages/BookingDetail'
import BookingPage from './features/bookings/pages/BookingPage'

// Projects
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
import SubmitReview from './features/reviews/pages/SubmitReview'

// Payments
import PaymentHistory from './features/payments/pages/PaymentHistory'
import PaymentPage from './features/payments/pages/PaymentPage'

// Notifications
import NotificationList from './features/notifications/pages/NotificationList'

// 🆕 SHOP IMPORTS
import ShopPage from './features/shop/pages/ShopPage'
import ProductDetailPage from './features/shop/pages/ProductDetailPage'
import CartPage from './features/shop/pages/CartPage'
import CheckoutPage from './features/shop/pages/CheckoutPage'
import OrderHistoryPage from './features/shop/pages/OrderHistoryPage'
import { CartProvider } from './features/shop/context/CartContext'

function App() {
  const location = useLocation()
  const hideNavbar = location.pathname === '/'

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <ScrollToTop />
        
        {/* Grid Overlay */}
        <div className="bg-grid-overlay" />
        
        {/* Navbar */}
        {!hideNavbar && <Navbar />}
        
        {/* Main Content */}
        <main className={`flex-1 relative z-10 ${hideNavbar ? '' : 'pt-16'}`}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/reviews" element={<ReviewList />} />
              <Route path="/submit-review" element={<ProtectedRoute><SubmitReview /></ProtectedRoute>} />
              
              {/* Services (listing page removed - browsing happens in the navbar mega-menu) */}
              {/* A sub-category with no child services acts as a service itself */}
              <Route path="/services/category/:id" element={<CategoryDetailPage />} />
              <Route path="/services/:id" element={<ServiceDetailPage />} />

              {/* Projects (listing page removed - browsing happens in the navbar mega-menu) */}
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
              
              {/* 🆕 SHOP ROUTES */}
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/shop/products/:slug" element={<ProductDetailPage />} />
              <Route path="/shop/cart" element={<CartPage />} />
              
              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              
              {/* Protected */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/email-inbox" element={<ProtectedRoute><EmailInboxPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
              <Route path="/admin/roles" element={<AdminRoute><AdminRolesPage /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
              <Route path="/admin/email-accounts" element={<AdminRoute><AdminEmailAccountsPage /></AdminRoute>} />
              
              {/* Consultations */}
              <Route path="/consultations" element={<ProtectedRoute><ConsultationList /></ProtectedRoute>} />
              <Route path="/consultations/:id" element={<ProtectedRoute><ConsultationDetail /></ProtectedRoute>} />
              <Route path="/request-consultation" element={<ProtectedRoute><RequestConsultation /></ProtectedRoute>} />
              
              {/* Bookings */}
              <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
              <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
              <Route path="/book-appointment" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
              
              {/* 🆕 SHOP PROTECTED ROUTES */}
              <Route path="/shop/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/shop/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
              
              {/* Payments */}
              <Route path="/payment-history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
              <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
              
              {/* Notifications */}
              <Route path="/notifications" element={<ProtectedRoute><NotificationList /></ProtectedRoute>} />
              
              {/* 404 */}
              <Route path="*" element={
                <div className="min-h-[80vh] flex items-center justify-center">
                  <div className="glass-card text-center p-12">
                    <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
                    <p className="text-xl text-[var(--g-text-secondary)] mb-2">Page not found</p>
                    <p className="text-[var(--g-text-tertiary)] mb-8">The page you're looking for doesn't exist or has been moved.</p>
                    <Link to="/home" className="btn-primary btn-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
                      </svg>
                      Go Home
                    </Link>
                  </div>
                </div>
              } />
            </Routes>
          </AnimatePresence>
        </main>
        
        {/* Footer */}
        {!hideNavbar && <Footer />}
      </div>
    </CartProvider>
  )
}

export default App