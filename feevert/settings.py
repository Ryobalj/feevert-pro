"""
Django settings for feevert project.
Render Ready Configuration
"""

import os
from pathlib import Path
from datetime import timedelta
from decouple import config
import sys
import dj_database_url

# ===========================
# BASE DIRECTORY
# ===========================
BASE_DIR = Path(__file__).resolve().parent.parent

# ===========================
# SECURITY SETTINGS
# ===========================
SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-for-local')
DEBUG = config('DEBUG', default=False, cast=bool)

# ALLOWED_HOSTS
if DEBUG:
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='.onrender.com,feevert.co.tz,www.feevert.co.tz,localhost,127.0.0.1').split(',')

# ===========================
# INSTALLED APPS
# ===========================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'whitenoise.runserver_nostatic',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'django_countries',
    'phonenumber_field',
    'django_recaptcha',
    'widget_tweaks',
    'modeltranslation',
    'channels',
    # # 'django_ngrok',
    
    # Local apps
    'core',
    'home',
    'consultations',
    'bookings',
    'reviews',
    'notifications',
    'accounts',
    'payments',
    'projects',
    'careers',
    'news',
    'team',
    'realtime',
]

# ===========================
# MIDDLEWARE
# ===========================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
]

# ===========================
# URL CONFIGURATION
# ===========================
ROOT_URLCONF = 'feevert.urls'
WSGI_APPLICATION = 'feevert.wsgi.application'
ASGI_APPLICATION = 'feevert.asgi.application'

# ===========================
# DATABASE (Render PostgreSQL)
# ===========================
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='feevert_db'),
            'USER': config('DB_USER', default='feevert_user'),
            'PASSWORD': config('DB_PASSWORD', default='feevert123'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }

# ===========================
# TEMPLATES
# ===========================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'home.context_processors.admin_dashboard_stats',
            ],
        },
    },
]

# ===========================
# PASSWORD VALIDATION
# ===========================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTH_USER_MODEL = 'accounts.User'

# ===========================
# INTERNATIONALIZATION
# ===========================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Dar_es_Salaam'
USE_I18N = True
USE_L10N = True
USE_TZ = True

LANGUAGES = [
    ('en', 'English'),
    ('sw', 'Kiswahili'),
]

LOCALE_PATHS = [BASE_DIR / 'locale']

# ===========================
# STATIC & MEDIA FILES
# ===========================
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Whitenoise Storage kwa Production
if not DEBUG:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
else:
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Disable static file locking for Termux
if os.name == 'posix':
    if 'termux' in sys.executable or 'com.termux' in sys.executable:
        import django.core.files.locks
        django.core.files.locks.lock = lambda *args, **kwargs: None
        django.core.files.locks.unlock = lambda *args, **kwargs: None

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DATA_UPLOAD_MAX_NUMBER_FIELDS = 10240
DATA_UPLOAD_MAX_NUMBER_FILES = 100

# ===========================
# AUTHENTICATION & LOGIN
# ===========================
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# ===========================
# EMAIL CONFIGURATION
# ===========================
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@feevert.co.tz')
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# ===========================
# RECAPTCHA SETTINGS
# ===========================
RECAPTCHA_PUBLIC_KEY = config('RECAPTCHA_PUBLIC_KEY_V2', default='')
RECAPTCHA_PRIVATE_KEY = config('RECAPTCHA_PRIVATE_KEY_V2', default='')
SILENCED_SYSTEM_CHECKS = ['django_recaptcha.recaptcha_test_key_error']

# ===========================
# CORS SETTINGS
# ===========================
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'https://feevert.co.tz',
    'https://www.feevert.co.tz',
    'https://*.ngrok-free.dev',
    'http://*.ngrok-free.dev',
]

FRONTEND_RENDER_URL = os.environ.get('FRONTEND_RENDER_URL')
if FRONTEND_RENDER_URL:
    CORS_ALLOWED_ORIGINS.append(FRONTEND_RENDER_URL)

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-request-id',
]

# CSRF TRUSTED ORIGINS
if DEBUG:
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'https://*.ngrok-free.dev',
        'http://*.ngrok-free.dev',
    ]
else:
    CSRF_TRUSTED_ORIGINS = [
        'https://feevert.co.tz',
        'https://www.feevert.co.tz',
        'https://*.onrender.com',
    ]

# ===========================
# CHANNELS (WebSocket) - In-Memory kwa Render
# ===========================
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# ===========================
# AFRICA'S TALKING SMS
# ===========================
AFRICASTALKING_USERNAME = config('AFRICASTALKING_USERNAME', default='sandbox')
AFRICASTALKING_API_KEY = config('AFRICASTALKING_API_KEY', default='')
AFRICASTALKING_SENDER_ID = config('AFRICASTALKING_SENDER_ID', default='FEEVERT')

# ===========================
# REST FRAMEWORK (DRF)
# ===========================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10000/day',
        'user': '100000/day',
    },
}

# ===========================
# JWT AUTHENTICATION
# ===========================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# ===========================
# CONSULTATIONS SETTINGS
# ===========================
CONSULTATION_TYPES = [
    ('agriculture', 'Agriculture Consultancy'),
    ('environment', 'Environment & OHS'),
    ('business', 'Business Advisory'),
    ('livestock', 'Livestock Management'),
]

CONSULTATION_STATUS = [
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
]

# ===========================
# BOOKING SETTINGS
# ===========================
BOOKING_SETTINGS = {
    'MIN_ADVANCE_DAYS': 1,
    'MAX_ADVANCE_DAYS': 30,
    'DURATION_MINUTES': 60,
    'BUFFER_MINUTES': 15,
    'WORKING_HOURS_START': '09:00',
    'WORKING_HOURS_END': '17:00',
    'WORKING_DAYS': [1, 2, 3, 4, 5],
}

# ===========================
# REVIEWS & RATINGS
# ===========================
REVIEW_SETTINGS = {
    'MIN_RATING': 1,
    'MAX_RATING': 5,
    'DEFAULT_RATING': 5,
    'REQUIRE_VERIFIED_PURCHASE': True,
    'MODERATE_REVIEWS': True,
    'ALLOW_PHOTOS': True,
    'MAX_PHOTOS_PER_REVIEW': 5,
}

# ===========================
# PAYMENT SETTINGS
# ===========================
PAYMENT_SETTINGS = {
    'CURRENCY': 'TZS',
    'TAX_RATE': 18,
    'ENABLE_M_PESA': True,
    'ENABLE_CARD': False,
}

# ===========================
# NOTIFICATION SETTINGS
# ===========================
NOTIFICATION_SETTINGS = {
    'ENABLE_EMAIL': True,
    'ENABLE_SMS': True,
    'ENABLE_IN_APP': True,
    'SMS_PROVIDER': 'africastalking',
    'REMINDER_HOURS': [24, 1],
}

# ===========================
# ENVIRONMENT DETECTION
# ===========================
IS_PRODUCTION = not DEBUG

if IS_PRODUCTION:
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://feevert.co.tz')
    BACKEND_URL = os.environ.get('BACKEND_URL', 'https://feevert.co.tz')
else:
    FRONTEND_URL = 'http://localhost:5173'
    BACKEND_URL = 'http://127.0.0.1:8000'

# ===========================
# CACHE SETTINGS (Memory Cache)
# ===========================
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# ===========================
# LOGGING
# ===========================
LOGS_DIR = BASE_DIR / 'logs'
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# ===========================
# SECURITY HEADERS (Production)
# ===========================
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# ===========================
# DEFAULT AUTO FIELD
# ===========================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===========================
# CONTACT FORM EMAIL
# ===========================
CONTACT_FORM_EMAIL = config('CONTACT_FORM_EMAIL', default='admin@feevert.co.tz')

# ===========================
# PAWAPAY PAYMENT SETTINGS
# ===========================
PAWAPAY_ENABLED = config('PAWAPAY_ENABLED', default=True, cast=bool)
PAWAPAY_SANDBOX_API_KEY = config('PAWAPAY_SANDBOX_API_KEY', default='')
PAWAPAY_LIVE_API_KEY = config('PAWAPAY_LIVE_API_KEY', default='')
PAWAPAY_USE_SANDBOX = config('PAWAPAY_USE_SANDBOX', default=True, cast=bool)
PAWAPAY_CALLBACK_URL = config('PAWAPAY_CALLBACK_URL', default='https://feevert.co.tz/payments/webhooks/pawapay/')
PAWAPAY_WEBHOOK_SECRET = config('PAWAPAY_WEBHOOK_SECRET', default='')

# ===========================
# TEST MODE
# ===========================
if 'test' in sys.argv:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'test_db.sqlite3',
        }
    }
    DEBUG = False
    PAWAPAY_USE_SANDBOX = False