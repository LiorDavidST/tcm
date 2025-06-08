import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from firebase.course_management import add_course

# הוספת קורס חדש
add_course('course_1', 'Python for Beginners', 'An introductory course to Python', 100, 30)
