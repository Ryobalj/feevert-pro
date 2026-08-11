# core/pagination.py
"""Default pagination that actually honours ?page_size=.

REST_FRAMEWORK's 'PAGE_SIZE_QUERY_PARAM' setting does nothing on its own —
PageNumberPagination reads `page_size_query_param` off the class. Without it
every list is capped at PAGE_SIZE (9), which is fine for cards but made the
mail inbox look nearly empty no matter how much mail had synced.
"""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size_query_param = 'page_size'
    max_page_size = 500
