// ✅ שדרוג askTCMAssistant עם מנגנון ביטול קריאה קודמת
let modelTimeoutId = null;
let currentFetchController = null;

// 🔹 משתנים גלובליים
let lessonsData = {};
let currentLessonIndex = 0;
let currentTopicIndex = 0;
let currentSubtopicIndex = null;
let pyodide = null;

// אתחול Pyodide
async function startPyodide() {
  pyodide = await loadPyodide();
  console.log("✅ Pyodide loaded.");

  // 📥 תמיכה בקלט של המשתמש (input())
  pyodide.setStdin({
    readline: () => prompt("Enter input:")
  });

  const runBtn = document.querySelector("button[onclick='runCode()']");
  if (runBtn) runBtn.disabled = false; // הפעלת כפתור Run לאחר טעינה
}


// טעינה ראשונית
async function loadLessons() {
  const runBtn = document.querySelector("button[onclick='runCode()']");
  if (runBtn) runBtn.disabled = true; // מניעת ריצה לפני טעינה

  await startPyodide();
  try {
    const [res1, res2, res3] = await Promise.all([
      fetch('/static/lessons_python.json'),
      fetch('/static/Lessons2_python.json'),
      fetch('/static/Lessons3_python.json')
    ]);
    const data1 = await res1.json();
    const data2 = await res2.json();
    const data3 = await res3.json();

    lessonsData.lessons = [
      ...(data1.lessons || []),
      ...(data2.lessons || []),
      ...(data3.lessons || [])
    ];

    renderLessonList();
    showCurrentTopic();
  } catch (error) {
    console.error('Failed to load lessons:', error);
  }
}

// הצגת נושא נוכחי
function showCurrentTopic() {
  const lesson = lessonsData.lessons[currentLessonIndex];
  const topic = lesson.topics[currentTopicIndex];
  const isFinalPractice = topic.subtopics && Array.isArray(topic.subtopics);
  const isInFinalPracticeSection = lesson.title.includes("Final Practice");

  const titleElement = document.getElementById('topic-title');
  const theoryElement = document.getElementById('topic-theory');
  const exampleElement = document.getElementById('topic-example');
  const exerciseElement = document.getElementById('topic-exercise');
  const codeElement = document.getElementById('code');
  const solutionBtn = document.getElementById('solution-button');
  const solutionBox = document.getElementById('solution-box');
  solutionBtn.onclick = toggleSolution;

  if (isFinalPractice) {
    const sub = topic.subtopics[currentSubtopicIndex || 0];
    titleElement.textContent = sub.title;
    theoryElement.textContent = sub.theory || "";
    exampleElement.innerHTML = "";
    exerciseElement.innerHTML = "<strong>Exercise:</strong><br>" + (sub.exercise || '').replace(/\n/g, "<br>");
    codeElement.value = "";
    solutionBtn.style.display = sub.solution ? 'inline-block' : 'none';
    solutionBtn.textContent = 'Show Solution';
    solutionBtn.dataset.visible = 'false';
    solutionBox.style.display = 'none';
    solutionBox.textContent = '';
  } else {
    titleElement.textContent = topic.title;
    theoryElement.textContent = topic.theory || '';
    exampleElement.innerHTML = isInFinalPracticeSection ? "" : "<strong>Try it:</strong><br>" + (topic.exercise || '').replace(/^Try it:\s*/i, '').replace(/\n/g, "<br>");
    exerciseElement.innerHTML = "";
    codeElement.value = topic.starter_code || '';
    solutionBtn.style.display = topic.solution ? 'inline-block' : 'none';
    solutionBtn.textContent = 'Show Solution';
    solutionBtn.dataset.visible = 'false';
    solutionBox.style.display = 'none';
    solutionBox.textContent = '';
  }

  const progress = document.getElementById('progress');
  if (progress) {
    progress.textContent = `Topic ${currentTopicIndex + 1} of ${lesson.topics.length} : ${topic.title}`;
  }

  highlightActiveTopic();

  // ✅ שליחת שאלה למודל – מבוקר עם ביטול ואיפוס המתנה
  if (modelTimeoutId) clearTimeout(modelTimeoutId);
  if (currentFetchController) currentFetchController.abort();
  modelTimeoutId = setTimeout(() => {
    const input = document.getElementById("tcm-input");
    if (input) {
      input.value = "suggest";
      askTCMAssistant();
    }
  }, 1000);
}


function toggleSolution() {
  const codeBox = document.getElementById('code');
  const btn = document.getElementById('solution-button');
  const lesson = lessonsData.lessons[currentLessonIndex];
  const topic = lesson.topics[currentTopicIndex];

  let solutionCode = '';

  if (topic.subtopics && Array.isArray(topic.subtopics)) {
    const sub = topic.subtopics[currentSubtopicIndex || 0];
    solutionCode = sub.solution || '';
  } else {
    solutionCode = topic.solution || '';
  }

  if (btn.dataset.visible === 'true') {
    codeBox.value = '';
    btn.textContent = 'Show Solution';
    btn.dataset.visible = 'false';
  } else {
    codeBox.value = solutionCode;
    btn.textContent = 'Hide Solution';
    btn.dataset.visible = 'true';
  }
}







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

      if (topic.subtopics && Array.isArray(topic.subtopics)) {
        topic.subtopics.forEach((subtopic, subIdx) => {
          if (typeof subtopic === 'object' && subtopic.title) {
            const subtopicItem = document.createElement('li');
            subtopicItem.textContent = subtopic.title;
            subtopicItem.classList.add('topic-item');
            subtopicItem.style.marginLeft = '20px';
            subtopicItem.onclick = () => {
              currentLessonIndex = lessonIdx;
              currentTopicIndex = topicIdx;
              currentSubtopicIndex = subIdx;
              showCurrentTopic();
            };
            topicList.appendChild(subtopicItem);
          }
        });
      }
    });

    lessonItem.appendChild(lessonTitle);
    lessonItem.appendChild(topicList);
    lessonList.appendChild(lessonItem);
  });
}

function highlightActiveTopic() {
  const allTopics = document.querySelectorAll('.topic-item');
  allTopics.forEach(item => {
    item.classList.remove('active');
  });
}

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

async function runCode() {
  const code = document.getElementById("code").value;
  const outputElement = document.getElementById("output");
  outputElement.innerHTML = "";

  let capturedOutput = "";

  pyodide.setStdout({
    batched: (text) => capturedOutput += text + "\n"
  });

  pyodide.setStderr({
    batched: (text) => capturedOutput += `❌ ${text}\n`
  });

  try {
    await pyodide.runPythonAsync(code);
  } catch (err) {
    capturedOutput += `❌ ${String(err)}\n`;
  }

  // פיצול לשורות בטוחות
  outputElement.innerHTML = "";
  capturedOutput.split(/\r?\n/).forEach(line => {
    const div = document.createElement("div");
    div.textContent = line;
    outputElement.appendChild(div);
  });
}

function copyCode() {
  const codeBox = document.getElementById("code");
  const confirmIcon = document.getElementById("copy-confirm");

  navigator.clipboard.writeText(codeBox.value)
    .then(() => {
      if (confirmIcon) {
        confirmIcon.style.display = "inline";
        setTimeout(() => {
          confirmIcon.style.display = "none";
        }, 3000);
      }
    })
    .catch(err => {
      console.error("Failed to copy code:", err);
    });
}



function toggleTheme() {
  const body = document.body;
  if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
  } else {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
  }
}

function toggleNeonColor() {
  const colors = ['#00ffff', '#ff00ff', '#ffcc00', '#00ff99', '#ff3399', '#66ccff', '#ff6600'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const sidebar = document.querySelector('.sidebar');
  const editor = document.querySelector('.editor');
  const output = document.querySelector('.output');
  const codeArea = document.getElementById('code');
  const outputBox = document.getElementById('output');
  const tcmBox = document.getElementById('tcm-box');
  const inputBox = document.getElementById('tcm-input');
  const tcmOutput = document.getElementById('tcm-output');
  const topicExampleBox = document.getElementById('topic-example');

  if (inputBox) inputBox.style.border = `1px solid ${color}`;
  if (sidebar) sidebar.style.borderRight = `2px solid ${color}`;
  if (editor) editor.style.borderRight = `2px solid ${color}`;
  if (output) output.style.borderLeft = `2px solid ${color}`;
  if (codeArea) codeArea.style.border = `1px solid ${color}`;
  if (outputBox) outputBox.style.border = `1px solid ${color}`;
  if (tcmBox) tcmBox.style.border = `1px solid ${color}`;
  if (tcmOutput) tcmOutput.style.border = `1px solid ${color}`;
  if (topicExampleBox) topicExampleBox.style.border = 'none';

}

// 🔍 עדכון פונקציה askTCMAssistant עם לוגים
async function askTCMAssistant() {
  const input = document.getElementById("tcm-input");
  const output = document.getElementById("tcm-output");
  const question = input.value.trim();
  if (!question) return;

  const isAutoSuggest = question === "suggest";
  let assistantDiv = null;

  if (!isAutoSuggest) {
    const exchange = document.createElement("div");
    exchange.className = "tcm-exchange";

    const userDiv = document.createElement("div");
    userDiv.className = "user-question";
    userDiv.innerHTML = `<strong>You:</strong> ${question}`;

    assistantDiv = document.createElement("div");
    assistantDiv.className = "assistant-reply";
    assistantDiv.textContent = "Assistant is thinking...";

    exchange.appendChild(userDiv);
    exchange.appendChild(assistantDiv);
    output.appendChild(exchange);
    output.scrollTop = output.scrollHeight;
  }

  input.value = "";

  // ביטול קריאה קודמת אם קיימת
  if (currentFetchController) currentFetchController.abort();
  currentFetchController = new AbortController();
  const signal = currentFetchController.signal;

  const lesson = lessonsData.lessons?.[currentLessonIndex];
  const topic = lesson?.topics?.[currentTopicIndex];
  const subtopic = topic?.subtopics?.[currentSubtopicIndex || 0];
  const currentTopicTitle = subtopic?.title || topic?.title || null;

  let questionText = question.toLowerCase() === "suggest"
    ? "suggest"
    : ["1", "2", "3"].includes(question.trim())
      ? `option_${question.trim()}`
      : question;

  const payload = {
    question: questionText,
    current_lesson_topic: currentTopicTitle
  };

  console.log("📤 שולח למודל את השאלה:", payload);

  try {
    const response = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal
    });

    const data = await response.json();
    console.log("📥 תשובה מהמודל:", data);
    const reply = data.answer || "⚠️ No response received.";

    if (isAutoSuggest) {
      output.innerHTML = `<div class='assistant-reply'>${marked.parse(reply)}</div>`;
    } else if (assistantDiv) {
      assistantDiv.innerHTML = marked.parse(reply);
      output.scrollTop = output.scrollHeight;
    }

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn("🔁 קריאה בוטלה לפני סיום (abort)");
    } else if (assistantDiv) {
      assistantDiv.innerHTML = `❌ Error: ${err.message}`;
      output.scrollTop = output.scrollHeight;
    }
  }
}

// ⬇️ הפעלת טעינת שיעורים כשדף נטען
window.onload = loadLessons;
