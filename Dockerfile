# 🐍 שלב 1: בחר Image בסיס עם Python
FROM python:3.11-slim

# 📁 שלב 2: הגדרת תיקיית עבודה
WORKDIR /app

# 📥 שלב 3: העתקת כל קבצי הפרויקט
COPY . .

# 🧪 שלב 4: התקנת הספריות מ־requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 🚀 שלב 5: הפעלת Flask ישירות
CMD ["python", "app.py"]
