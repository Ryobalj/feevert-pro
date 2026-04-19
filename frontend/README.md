# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# 📁 FEEVERT FRONTEND STRUCTURE (REACT + VITE)

src/
│
├── app/                          # Global app config
│   ├── store.js
│   ├── api.js
│   ├── routes.jsx
│   └── providers.jsx
│
├── assets/                       # Images, icons, logos
│   ├── images/
│   ├── icons/
│   └── styles/
│
├── components/                   # Reusable components (global)
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Loader.jsx
│   │   └── Card.jsx
│   │
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Sidebar.jsx
│   │   └── DashboardLayout.jsx
│   │
│   └── common/
│       ├── EmptyState.jsx
│       ├── ErrorState.jsx
│       └── ConfirmDialog.jsx
│
├── features/                     # 🔥 MAIN BUSINESS LOGIC (APP-BASED)
│
│   ├── home/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── AboutPage.jsx
│   │   │   ├── ContactPage.jsx
│   │   │   └── ServicesPage.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── HeroSection.jsx
│   │   │   ├── ServicesSection.jsx
│   │   │   ├── Testimonials.jsx
│   │   │   └── CTASection.jsx
│   │   │
│   │   └── api/homeApi.js
│
│   ├── accounts/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   └── VerifyEmailPage.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── AuthLayout.jsx
│   │   │
│   │   ├── api/authApi.js
│   │   ├── hooks/useAuth.js
│   │   └── store/authSlice.js
│
│   ├── consultations/
│   │   ├── pages/
│   │   │   ├── ConsultationList.jsx
│   │   │   ├── ConsultationDetail.jsx
│   │   │   └── RequestConsultation.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── ConsultationCard.jsx
│   │   │   └── ConsultationForm.jsx
│   │   │
│   │   └── api/consultationApi.js
│
│   ├── bookings/
│   │   ├── pages/
│   │   │   ├── BookingPage.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   └── BookingDetail.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── BookingForm.jsx
│   │   │   └── CalendarPicker.jsx
│   │   │
│   │   └── api/bookingApi.js
│
│   ├── reviews/
│   │   ├── components/
│   │   │   ├── ReviewList.jsx
│   │   │   ├── ReviewForm.jsx
│   │   │   └── RatingStars.jsx
│   │   │
│   │   └── api/reviewApi.js
│
│   ├── notifications/
│   │   ├── components/
│   │   │   ├── NotificationBell.jsx
│   │   │   └── NotificationList.jsx
│   │   │
│   │   └── api/notificationApi.js
│
│   ├── payments/
│   │   ├── pages/
│   │   │   ├── PaymentPage.jsx
│   │   │   └── PaymentHistory.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── PaymentForm.jsx
│   │   │   └── InvoiceCard.jsx
│   │   │
│   │   └── api/paymentApi.js
│
│   ├── projects/
│   │   ├── pages/
│   │   │   ├── ProjectList.jsx
│   │   │   └── ProjectDetail.jsx
│   │   │
│   │   ├── components/
│   │   │   └── ProjectCard.jsx
│   │   │
│   │   └── api/projectApi.js
│
│   ├── careers/
│   │   ├── pages/
│   │   │   ├── JobList.jsx
│   │   │   └── JobDetail.jsx
│   │   │
│   │   ├── components/
│   │   │   └── JobCard.jsx
│   │   │
│   │   └── api/careerApi.js
│
│   ├── news/
│   │   ├── pages/
│   │   │   ├── NewsList.jsx
│   │   │   └── NewsDetail.jsx
│   │   │
│   │   ├── components/
│   │   │   └── NewsCard.jsx
│   │   │
│   │   └── api/newsApi.js
│
│   ├── team/
│   │   ├── pages/
│   │   │   ├── TeamList.jsx
│   │   │   └── TeamMemberDetail.jsx
│   │   │
│   │   ├── components/
│   │   │   └── TeamCard.jsx
│   │   │
│   │   └── api/teamApi.js
│
│   ├── realtime/
│   │   ├── hooks/useWebSocket.js
│   │   └── components/
│   │       └── ChatBox.jsx
│
│
├── hooks/                        # Global hooks
│   ├── useFetch.js
│   └── useDebounce.js
│
├── utils/                        # Utilities
│   ├── constants.js
│   ├── helpers.js
│   └── formatters.js
│
├── routes/                       # Route definitions
│   ├── PublicRoutes.jsx
│   ├── PrivateRoutes.jsx
│   └── AppRoutes.jsx
│
├── App.jsx
├── main.jsx
└── index.css

src/
├── app/
│   ├── store.js
│   └── api.js
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── ui/
│   │   ├── Loader.jsx
│   │   └── Button.jsx
│   └── common/
│       └── ScrollToTop.jsx
├── features/
│   ├── home/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── AboutPage.jsx
│   │   │   ├── ServicesPage.jsx
│   │   │   └── ContactPage.jsx
│   │   ├── components/
│   │   │   ├── HeroSection.jsx
│   │   │   ├── ServicesSection.jsx
│   │   │   ├── ProjectsSection.jsx
│   │   │   ├── TeamSection.jsx
│   │   │   ├── FAQSection.jsx
│   │   │   ├── PartnersSection.jsx
│   │   │   ├── TestimonialsSection.jsx
│   │   │   └── CTASection.jsx
│   │   └── api/homeApi.js
│   ├── accounts/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── hooks/useAuth.js
│   │   └── store/authSlice.js
│   ├── consultations/
│   │   ├── pages/
│   │   │   ├── ConsultationList.jsx
│   │   │   ├── ConsultationDetail.jsx
│   │   │   └── RequestConsultation.jsx
│   │   ├── components/ConsultationCard.jsx
│   │   └── api/consultationApi.js
│   ├── bookings/
│   │   ├── pages/
│   │   │   ├── MyBookings.jsx
│   │   │   ├── BookingPage.jsx
│   │   │   └── BookingDetail.jsx
│   │   └── api/bookingApi.js
│   ├── reviews/
│   │   ├── pages/ReviewList.jsx
│   │   ├── components/
│   │   │   ├── ReviewForm.jsx
│   │   │   └── RatingStars.jsx
│   │   └── api/reviewApi.js
│   ├── notifications/
│   │   ├── components/
│   │   │   ├── NotificationBell.jsx
│   │   │   └── NotificationList.jsx
│   │   └── api/notificationApi.js
│   ├── payments/
│   │   ├── pages/
│   │   │   ├── PaymentPage.jsx
│   │   │   └── PaymentHistory.jsx
│   │   ├── components/
│   │   │   ├── PaymentForm.jsx
│   │   │   └── InvoiceCard.jsx
│   │   └── api/paymentApi.js
│   ├── projects/
│   │   ├── pages/
│   │   │   ├── ProjectList.jsx
│   │   │   └── ProjectDetail.jsx
│   │   ├── components/ProjectCard.jsx
│   │   └── api/projectApi.js
│   ├── careers/
│   │   ├── pages/
│   │   │   ├── JobList.jsx
│   │   │   └── JobDetail.jsx
│   │   ├── components/ApplyForm.jsx
│   │   └── api/careerApi.js
│   ├── news/
│   │   ├── pages/
│   │   │   ├── NewsList.jsx
│   │   │   └── NewsDetail.jsx
│   │   ├── components/NewsletterSubscribe.jsx
│   │   └── api/newsApi.js
│   ├── team/
│   │   ├── pages/
│   │   │   ├── TeamList.jsx
│   │   │   └── TeamMemberDetail.jsx
│   │   ├── components/TeamCard.jsx
│   │   └── api/teamApi.js
│   └── realtime/
│       ├── hooks/useWebSocket.js
│       └── components/ChatBox.jsx
├── hooks/
│   ├── useFetch.js
│   └── useScrollAnimation.js
├── i18n.js
├── App.jsx
├── main.jsx
└── index.css
