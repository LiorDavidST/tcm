import sys
import os

# הוספת תיקיית הפרויקט לשביל המודולים
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from firebase.user_management import add_user

add_user('12345', 'John', 'Doe', 'johndoe@example.com')
