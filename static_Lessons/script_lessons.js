let lessonsData = {};
let currentLessonIndex = 0;
let currentTopicIndex = 0;
let currentSubtopicIndex = null;

// טעינה ראשונית
async function loadLessons() {
  try {
    const response = await fetch('/static/lessons.json');
    lessonsData = await response.json();
    renderLessonList();
    showCurrentTopic();
  } catch (error) {
    console.error('Failed to load lessons:', error);
  }
}

// הצגת נושא נוכחי או תת-נושא
function showCurrentTopic() {
  const lesson = lessonsData.lessons[currentLessonIndex];
  const topic = lesson.topics[currentTopicIndex];
  const isFinalPractice = topic.title === "Final Practice – Review All Topics" && topic.subtopics;

  const titleElement = document.getElementById('topic-title');
  const theoryElement = document.getElementById('topic-theory');
  const exampleElement = document.getElementById('topic-example');
  const exerciseElement = document.getElementById('topic-exercise');
  const codeElement = document.getElementById('code');
  const solutionBtn = document.getElementById('solution-button');
  const solutionBox = document.getElementById('solution-box');

  if (isFinalPractice) {
    const subtopics = topic.subtopics;
    const sub = subtopics[currentSubtopicIndex || 0];

    titleElement.textContent = sub.title;
    theoryElement.textContent = "";
    exampleElement.textContent = "";
    exerciseElement.textContent = sub.exercise || "";
    codeElement.value = "";

    if (sub.solution) {
      solutionBtn.style.display = 'inline-block';
      solutionBtn.textContent = 'Show Solution';
      solutionBox.style.display = 'none';
      solutionBox.textContent = sub.solution;
    } else {
      solutionBtn.style.display = 'none';
      solutionBox.style.display = 'none';
      solutionBox.textContent = '';
    }

  } else {
    titleElement.textContent = topic.title;
    theoryElement.textContent = topic.theory || '';
    exampleElement.textContent = topic.example || '';
    exerciseElement.innerHTML = (topic.exercise || '').replace(/\n/g, "<br>");
    codeElement.value = topic.starter_code || '';

    solutionBtn.style.display = 'none';
    solutionBox.style.display = 'none';
    solutionBox.textContent = '';
  }

  document.getElementById('progress').textContent = `Topic ${currentTopicIndex + 1} of ${lesson.topics.length}`;
  highlightActiveTopic();
}

// פונקציה להצגת/הסתרת פתרון
function toggleSolution() {
  const box = document.getElementById('solution-box');
  const btn = document.getElementById('solution-button');
  if (box.style.display === 'none') {
    box.style.display = 'block';
    btn.textContent = 'Hide Solution';
  } else {
    box.style.display = 'none';
    btn.textContent = 'Show Solution';
  }
}

// יצירת תפריט שיעורים ונושאים (כולל תתי נושאים ל-Final Practice)
function renderLessonList() {
  const lessonList = document.getElementById('lesson-list');
  lessonList.innerHTML = '';

  lessonsData.lessons.forEach((lesson, lessonIdx) => {
    const lessonItem = document.createElement('li');
    lessonItem.style.marginBottom = '5px';

    const lessonTitle = document.createElement('div');
    lessonTitle.textContent = lesson.title;
    lessonTitle.style.cursor = 'pointer';

    const topicList = document.createElement('ul');
    topicList.style.display = 'none';
    topicList.style.marginTop = '5px';
    topicList.style.marginLeft = '15px';

    // Toggle accordion
    lessonTitle.onclick = () => {
      const isOpen = lessonItem.classList.contains('open');
      document.querySelectorAll('#lesson-list li').forEach(li => li.classList.remove('open'));
      topicList.style.display = isOpen ? 'none' : 'block';
      lessonItem.classList.toggle('open', !isOpen);
    };

    lesson.topics.forEach((topic, topicIdx) => {
      const topicItem = document.createElement('li');
      topicItem.textContent = topic.title;
      topicItem.classList.add('topic-item');
      topicItem.setAttribute('data-lesson', lessonIdx);
      topicItem.setAttribute('data-topic', topicIdx);

      topicItem.onclick = () => {
        currentLessonIndex = lessonIdx;
        currentTopicIndex = topicIdx;
        currentSubtopicIndex = null;
        showCurrentTopic();
      };

      topicList.appendChild(topicItem);

      // 🔵 אם זה Final Practice – הוסף גם את תתי הנושאים
      if (topic.title === "Final Practice – Review All Topics" && topic.subtopics) {
        topic.subtopics.forEach((subtopic, subIdx) => {
          const subtopicItem = document.createElement('li');
          subtopicItem.textContent = subtopic.title;
          subtopicItem.classList.add('topic-item');
          subtopicItem.style.marginLeft = '20px'; // הזחה ברורה
          subtopicItem.onclick = () => {
            currentLessonIndex = lessonIdx;
            currentTopicIndex = topicIdx;
            currentSubtopicIndex = subIdx;
            showCurrentTopic();
          };
          topicList.appendChild(subtopicItem);
        });
      }
    });

    lessonItem.appendChild(lessonTitle);
    lessonItem.appendChild(topicList);
    lessonList.appendChild(lessonItem);
  });
}

// הדגשת נושא פעיל
function highlightActiveTopic() {
  const allTopics = document.querySelectorAll('.topic-item');
  allTopics.forEach(item => {
    item.classList.remove('active');
  });
}

// ניווט לנושא הבא
function nextTopic() {
  const topics = lessonsData.lessons[currentLessonIndex].topics;
  const topic = topics[currentTopicIndex];

  if (topic.subtopics && topic.subtopics.length > (currentSubtopicIndex ?? 0) + 1) {
    currentSubtopicIndex++;
    showCurrentTopic();
  } else if (currentTopicIndex < topics.length - 1) {
    currentTopicIndex++;
    currentSubtopicIndex = null;
    showCurrentTopic();
  }
}

// ניווט לנושא הקודם
function prevTopic() {
  const topic = lessonsData.lessons[currentLessonIndex].topics[currentTopicIndex];

  if (topic.subtopics && (currentSubtopicIndex ?? 0) > 0) {
    currentSubtopicIndex--;
    showCurrentTopic();
  } else if (currentTopicIndex > 0) {
    currentTopicIndex--;
    currentSubtopicIndex = null;
    showCurrentTopic();
  }
}

// שליחת קוד להרצה
async function runCode() {
  const code = document.getElementById('code').value;

  try {
    const response = await fetch('http://127.0.0.1:5000/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });

    const result = await response.json();
    document.getElementById('output').textContent = result.output;
  } catch (error) {
    document.getElementById('output').textContent = 'Error: ' + error;
  }
}

window.onload = loadLessons;
