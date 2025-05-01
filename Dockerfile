# שלב 1: Image בסיס של Python
FROM python:3.11-slim

# שלב 2: יצירת תיקייה לאפליקציה
WORKDIR /app

# שלב 3: העתקת כל הקבצים
COPY . .

# שלב 4: התקנת התלויות
RUN pip install --no-cache-dir -r requirements.txt

# שלב 5: הפעלת האפליקציה עם Flask
CMD ["python", "app.py"]
