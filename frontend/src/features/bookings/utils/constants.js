// src/features/bookings/utils/constants.js

export const BOOKING_STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled']

export const STATUS_STYLES = {
  confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}