# FEE-VERT SOLUTION LIMITED – WEBSITE PROJECT PLAN

## 🎯 Project Goal
- Kuuza huduma
- Kupata wateja
- Kuonyesha kazi (portfolio)
- Kuwa online professionally

---

# 🧱 PHASE 1: PROJECT SETUP (Day 1)

## ✅ Milestones
- Setup frontend (Vite + React)
- Setup backend (Django + DRF)
- Setup project structure

## 📋 Checklist
- [ ] Create Vite React app
- [ ] Install dependencies (axios, router, i18n)
- [ ] Setup folder structure (components, pages, services)
- [ ] Setup Django project + app (api)
- [ ] Setup PostgreSQL (optional)
- [ ] Setup CORS & API connection

---

# 🎨 PHASE 2: UI/UX DESIGN (Day 2–4)

## ✅ Milestones
- Design layout ya website nzima
- Implement branding (green theme)

## 📋 Checklist
- [ ] Create Navbar (logo + menu)
- [ ] Create Footer
- [ ] Define color palette (Green, Light Green, White, Black)
- [ ] Setup typography
- [ ] Add responsive design (mobile first)

---

# 📄 PHASE 3: PAGES DEVELOPMENT (Day 4–8)

## ✅ Milestones
- Pages zote ziwepo (static first)

## 📋 Checklist

### 🏠 Home
- [ ] Hero section
- [ ] Services preview
- [ ] Projects preview
- [ ] CTA buttons

### ℹ️ About
- [ ] Company description
- [ ] Mission & Vision
- [ ] Team members + portfolios

### 🛠 Services
- [ ] List of services
- [ ] Service details

### 🖼 Projects
- [ ] Portfolio grid
- [ ] Project details modal/page

### 📞 Contact
- [ ] Contact form
- [ ] Map/location (optional)

### 📅 Book Appointment
- [ ] Booking form

### 📰 News
- [ ] Blog layout
- [ ] Article list

### 💼 Careers
- [ ] Job listings
- [ ] Apply form

---

# ⚙️ PHASE 4: BACKEND API (Day 6–10)

## ✅ Milestones
- APIs zote ziwe ready

## 📋 Checklist
- [ ] ContactMessage model + API
- [ ] Service model + API
- [ ] Project model + API
- [ ] Career model + API
- [ ] Application model + API
- [ ] Appointment model + API
- [ ] Admin panel setup

---

# 🔌 PHASE 5: INTEGRATION (Day 8–11)

## ✅ Milestones
- Frontend iwasiliane na backend

## 📋 Checklist
- [ ] Connect axios to API
- [ ] Submit contact form → backend
- [ ] Fetch services → frontend
- [ ] Fetch projects → frontend
- [ ] Careers + applications working
- [ ] Appointment submission working

---

# 🌍 PHASE 6: MULTI-LANGUAGE (Day 10–11)

## ✅ Milestones
- Website iwe EN + SW

## 📋 Checklist
- [ ] Install react-i18next
- [ ] Create translation files (EN/SW)
- [ ] Add language switch button
- [ ] Translate key pages

---

# 💰 PHASE 7: PAYMENT INTEGRATION (Day 11–12)

## ✅ Milestones
- M-Pesa payment working

## 📋 Checklist
- [ ] Setup payment API (PawaPay/M-Pesa)
- [ ] Create payment endpoint
- [ ] Connect frontend payment button
- [ ] Test transaction flow

---

# 🧪 PHASE 8: TESTING (Day 12–13)

## ✅ Milestones
- System iwe stable

## 📋 Checklist
- [ ] Test all forms
- [ ] Test mobile responsiveness
- [ ] Fix UI bugs
- [ ] Fix API errors
- [ ] Performance check

---

# 🚀 PHASE 9: DEPLOYMENT (Day 13–14)

## ✅ Milestones
- Website iwe live

## 📋 Checklist
- [ ] Setup hosting (domain tayari ipo)
- [ ] Deploy backend (VPS / Render / Railway)
- [ ] Deploy frontend (Vercel / Netlify)
- [ ] Connect domain
- [ ] Enable HTTPS (SSL)

---

# 🔥 FINAL DELIVERABLES

- [ ] Fully working website
- [ ] Admin panel (Django)
- [ ] Payment integration
- [ ] Multi-language support
- [ ] Responsive design

---

# 📈 BONUS (OPTIONAL FUTURE FEATURES)

- [ ] User accounts
- [ ] Dashboard
- [ ] Analytics
- [ ] SEO optimization
- [ ] WhatsApp integration
- [ ] Live chat

---

# ⏱ PROJECT TIMELINE SUMMARY

| Phase | Duration |
|------|--------|
| Setup | 1 day |
| UI Design | 2–3 days |
| Pages | 4 days |
| Backend | 3–4 days |
| Integration | 2–3 days |
| Testing | 1–2 days |
| Deployment | 1 day |

👉 Total: ~14 days

---

# 🧠 NOTES

- Focus kwenye **performance + simplicity**
- Usijaze animations nyingi kupita kiasi
- Prioritize **user conversion (customers)**

---

# ✅ SUCCESS CRITERIA

- Website inaload fast
- Forms zinafanya kazi
- Wateja wanaweza kuwasiliana kirahisi
- Portfolio inaonekana professional
- Payment flow inafanya kazi

---

# 📘 FEE-VERT BACKEND MODELS DESIGN – MILESTONES & CHECKLIST

---

## 🎯 PROJECT GOAL
Kuuza huduma | Kupata wateja | Kuonyesha kazi (portfolio) | Kuwa online professionally

---

# 🧠 1. PRINCIPLES ZA UFANISI (CORE RULES)

| Kanuni | Maelezo | Status |
|--------|---------|--------|
| DRY | Tumia BaseModel kwa fields zinazorudiwa | ⬜ Pending |
| Soft Delete | Tumia `is_deleted` + `deleted_at` | ⬜ Pending |
| Slug Auto-generation | Kila title/name iwe na slug automatic | ⬜ Pending |
| Indexing | Weka indexes kwenye slug, email, status | ⬜ Pending |
| JSONField | Tumia kwa data flexible (gallery, stats, etc.) | ⬜ Pending |
| Audit Trail | created_by + updated_by tracking | ⬜ Pending |

---

# 🧩 2. APPS OVERVIEW (SYSTEM MAP)

| # | App | Kazi | Status |
|---|-----|------|--------|
| 1 | home | Website content + SEO | ⬜ |
| 2 | consultations | Business services | ⬜ |
| 3 | bookings | Appointment system | ⬜ |
| 4 | reviews | Ratings & feedback | ⬜ |
| 5 | notifications | Alerts system | ⬜ |
| 6 | payments | Transactions (M-Pesa etc.) | ⬜ |
| 7 | accounts | Users & roles | ⬜ |
| 8 | projects | Portfolio | ⬜ |
| 9 | careers | Jobs system | ⬜ |
| 10 | news | Blog/news | ⬜ |
| 11 | team | Company team | ⬜ |
| 12 | core | Base utilities | ⬜ |

---

# 🧱 3. MILESTONES BREAKDOWN

---

## 🏠 MILESTONE 1: HOME APP

| Model | Fields | Status |
|------|--------|--------|
| SiteSetting | site_name, logo, contact, SEO | ⬜ |
| HeroSection | title, subtitle, CTA | ⬜ |
| AboutSection | mission, vision, stats(JSON) | ⬜ |
| ServiceHighlight | title, icon, order | ⬜ |
| SeoData | meta_title, meta_description | ⬜ |
| Faq | question, answer | ⬜ |
| Partner | name, logo | ⬜ |
| Testimonial | client, rating, message | ⬜ |

📊 Progress: 0/8

---

## 🌱 MILESTONE 2: CONSULTATIONS

| Model | Fields | Status |
|------|--------|--------|
| ConsultationCategory | name, slug | ⬜ |
| ConsultationService | price, duration | ⬜ |
| ConsultationRequest | client, service, status | ⬜ |
| ConsultationDocument | file | ⬜ |
| ConsultationFollowup | notes, date | ⬜ |

📊 Progress: 0/5

---

## 📅 MILESTONE 3: BOOKINGS

| Model | Fields | Status |
|------|--------|--------|
| TimeSlot | date, time | ⬜ |
| Booking | client, slot | ⬜ |
| Availability | working hours | ⬜ |
| Holiday | blocked dates | ⬜ |
| BookingReminder | reminders | ⬜ |

📊 Progress: 0/5

---

## ⭐ MILESTONE 4: REVIEWS

| Model | Fields | Status |
|------|--------|--------|
| Review | rating, comment | ⬜ |
| ReviewImage | image | ⬜ |
| ReviewHelpfulVote | vote | ⬜ |

📊 Progress: 0/3

---

## 🔔 MILESTONE 5: NOTIFICATIONS

| Model | Fields | Status |
|------|--------|--------|
| Notification | message, type | ⬜ |
| NotificationLog | delivery logs | ⬜ |
| NotificationTemplate | templates | ⬜ |
| UserNotificationSetting | preferences | ⬜ |

📊 Progress: 0/4

---

## 👤 MILESTONE 6: ACCOUNTS

| Model | Fields | Status |
|------|--------|--------|
| User | email, phone, role | ⬜ |
| Profile | bio, image | ⬜ |
| Role | permissions | ⬜ |
| UserActivityLog | logs | ⬜ |
| PasswordResetToken | token | ⬜ |
| EmailVerificationToken | token | ⬜ |

📊 Progress: 0/6

---

## 🖼️ MILESTONE 7: PROJECTS

| Model | Fields | Status |
|------|--------|--------|
| ProjectCategory | name, slug | ⬜ |
| Project | title, gallery | ⬜ |
| ProjectImage | image | ⬜ |
| ProjectTag | tags | ⬜ |
| ProjectAward | awards | ⬜ |

📊 Progress: 0/5

---

## 🧑‍💼 MILESTONE 8: CAREERS

| Model | Fields | Status |
|------|--------|--------|
| JobCategory | name | ⬜ |
| JobPost | title, salary | ⬜ |
| JobApplication | CV | ⬜ |
| SavedJob | saved jobs | ⬜ |
| JobAlert | alerts | ⬜ |

📊 Progress: 0/5

---

## 📰 MILESTONE 9: NEWS

| Model | Fields | Status |
|------|--------|--------|
| NewsCategory | name | ⬜ |
| NewsPost | content | ⬜ |
| Comment | replies | ⬜ |
| NewsletterSubscription | email | ⬜ |
| NewsletterCampaign | campaigns | ⬜ |
| NewsPostView | analytics | ⬜ |

📊 Progress: 0/6

---

## 👥 MILESTONE 10: TEAM

| Model | Fields | Status |
|------|--------|--------|
| TeamMember | profile, role | ⬜ |
| Department | structure | ⬜ |
| TeamSocial | links | ⬜ |
| Testimonial | feedback | ⬜ |

📊 Progress: 0/4

---

## 🧱 MILESTONE 11: CORE

| Class | Purpose | Status |
|------|--------|--------|
| BaseModel | shared fields | ⬜ |
| SoftDeleteManager | delete logic | ⬜ |

📊 Progress: 0/2

---

# 📊 OVERALL PROGRESS

| Metric | Value |
|--------|------|
| Apps | 11 |
| Models | 53 |
| Progress | 0% |

---

# ⚡ SETUP CHECKLIST

## Before Coding
- ⬜ Create apps
- ⬜ Setup BaseModel
- ⬜ Register apps in settings
- ⬜ Setup DB

## After Coding
- ⬜ makemigrations
- ⬜ migrate
- ⬜ serializers
- ⬜ viewsets
- ⬜ admin
- ⬜ APIs test

---

# 🧠 NOTES

- kila model iwe na `__str__`
- tumia `Meta ordering`
- weka indexes kwenye slug/email
- tumia UUID kwa scalability
- logic isiwe kwenye models (tumia services)

---

# 🚀 END