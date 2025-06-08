import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from firebase.progress_management import update_progress

# עדכון התקדמות משתמש בקורס
update_progress('12345', 'course_1', 5)
