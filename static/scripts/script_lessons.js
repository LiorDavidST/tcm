let modelTimeoutId = null;
let currentFetchController = null;

// משתנים גלובליים
let lessonsData = {};
let currentLessonIndex = 0;
let currentTopicIndex = 0;
let currentSubtopicIndex = null;
let pyodide = null;

// ✅ ניהול סימוני V
const progressMap = {};

// אתחול Pyodide
async function startPyodideAndLoad() {
  pyodide = await loadPyodide();
  console.log("✅ Pyodide loaded.");

  pyodide.setStdin({
    readline: () => prompt("📝 Please enter your input below:") ?? ""
  });

  await loadLessons();
  renderLessonList();
  renderProgressOverview();

  // טען עורך Monaco רק לאחר שהעמוד וה־div נטענו
  require(['vs/editor/editor.main'], function () {
    const codeElement = document.getElementById('code');
    const initialCode = codeElement && codeElement.value.trim() !== ""
      ? codeElement.value
      : `# Start typing Python code here\nprint("Hello from TCM!")`;

    const model = monaco.editor.createModel(initialCode, 'python');

    window.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
      model: model,
      theme: "vs-dark",
      fontSize: 16,
      wordWrap: "on",
      scrollBeyondLastLine: false,
      renderLineHighlight: "none",
      scrollbar: {
        vertical: "auto",
        horizontal: "auto"
      },
      rulers: []
    });
  });
}




async function loadLessons() {
  try {
    const urls = Array.from({ length: 10 }, (_, i) => `/static/lessons/Lessons${i + 1}_python.json`);
    
    const lessons = [];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`⚠️ Failed to fetch ${url}: ${res.status}`);
          continue;
        }

        const data = await res.json();
        if (data.lessons) {
          lessons.push(...data.lessons);
        }
      } catch (err) {
        console.error(`❌ Error loading ${url}:`, err);
      }
    }

    lessonsData.lessons = lessons;
    
    // 🚀 טען התקדמות אם קיימת
    const savedProgress = localStorage.getItem("lessonProgress");
    if (savedProgress) Object.assign(progressMap, JSON.parse(savedProgress));

    showCurrentTopic();
    renderLessonList();


  } catch (err) {
    console.error("❌ Failed to load lessons (global):", err);
    const output = document.getElementById("output");
    if (output) {
      output.innerText = "⚠️ Failed to load lessons. Please check your files.";
    }
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
  const solutionBtn = document.getElementById('solution-button');
  const solutionBox = document.getElementById('solution-box');
  solutionBtn.onclick = toggleSolution;

  let starterCode = '';

  if (isFinalPractice) {
    const sub = topic.subtopics[currentSubtopicIndex || 0];
    titleElement.textContent = sub.title;
    theoryElement.textContent = sub.theory || "";
    exampleElement.innerHTML = "";
    exerciseElement.innerHTML = "<strong>Exercise:</strong><br>" + (sub.exercise || '').replace(/\n/g, "<br>");
    starterCode = sub.starter_code || '';
    solutionBtn.style.display = sub.solution ? 'inline-block' : 'none';
  } else {
    titleElement.textContent = topic.title;
    theoryElement.textContent = topic.theory || '';
    exampleElement.innerHTML = isInFinalPracticeSection ? "" : "<strong>Try it:</strong><br>" + (topic.exercise || '').replace(/^Try it:\s*/i, '').replace(/\n/g, "<br>");
    exerciseElement.innerHTML = "";
    starterCode = topic.starter_code || '';
    solutionBtn.style.display = topic.solution ? 'inline-block' : 'none';
  }

  if (window.editor) {
    window.editor.setValue(starterCode || "# 🚀 Try solving it on your own before viewing the solution!");
  }

  solutionBtn.textContent = 'Show Solution';
  solutionBtn.dataset.visible = 'false';
  solutionBox.style.display = 'none';
  solutionBox.textContent = '';

  const progress = document.getElementById('progress');
  if (progress) {
    progress.textContent = `Topic ${currentTopicIndex + 1} of ${lesson.topics.length} : ${topic.title}`;
  }

  highlightActiveTopic();

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
  const button = document.getElementById('solution-button');
  const isVisible = button.dataset.visible === 'true';

  const lesson = lessonsData.lessons[currentLessonIndex];
  const topic = lesson.topics[currentTopicIndex];
  const isFinalPractice = topic.subtopics && Array.isArray(topic.subtopics);
  const sub = isFinalPractice ? topic.subtopics[currentSubtopicIndex || 0] : null;

  if (isVisible) {
    // ❌ הסתרת פתרון → הצגת starter code
    button.textContent = 'Show Solution';
    button.dataset.visible = 'false';

    const starterCode = isFinalPractice
      ? (sub?.starter_code || '')
      : (topic.starter_code || '');

    if (window.editor) {
      window.editor.setValue(starterCode || "# No starter code available.");
    }

  } else {
    // ✅ הצגת פתרון
    const solutionText = isFinalPractice
      ? (sub?.solution || '')
      : (topic.solution || '');

    if (window.editor) {
      window.editor.setValue(solutionText || "# No solution provided for this topic.");
    }

    button.textContent = 'Hide Solution';
    button.dataset.visible = 'true';
  }
}




// ... שאר הפונקציות נשמרות ללא שינוי ...

function renderLessonList() {
  const lessonList = document.getElementById('lesson-list');
  lessonList.innerHTML = '';

  lessonsData.lessons.forEach((lesson, lessonIdx) => {
    const lessonItem = document.createElement('li');
    lessonItem.style.marginBottom = '5px';

    const lessonTitle = document.createElement('div');
    lessonTitle.style.cursor = 'pointer';
    lessonTitle.style.display = 'flex';
    lessonTitle.style.alignItems = 'center';
    lessonTitle.style.gap = '8px';
    lessonTitle.style.justifyContent = 'space-between';

    const leftContainer = document.createElement('div');
    leftContainer.style.display = 'flex';
    leftContainer.style.alignItems = 'center';
    leftContainer.style.gap = '8px';

    const lessonKey = `lesson${lessonIdx}`;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = lesson.title;
    titleSpan.classList.add('lesson-title-text');
    leftContainer.appendChild(titleSpan);

    lessonTitle.appendChild(leftContainer);

    const topicList = document.createElement('ul');
    topicList.style.display = 'none';
    topicList.style.marginTop = '5px';
    topicList.style.marginLeft = '15px';

    lessonTitle.addEventListener('click', (e) => {
      if (e.target.classList.contains('v-icon')) return;
      const isOpen = lessonItem.classList.contains('open');
      document.querySelectorAll('#lesson-list li').forEach(li => li.classList.remove('open'));
      topicList.style.display = isOpen ? 'none' : 'block';
      lessonItem.classList.toggle('open', !isOpen);
    });

    lesson.topics.forEach((topic, topicIdx) => {
      const topicItem = document.createElement('li');
      topicItem.classList.add('topic-item');
      topicItem.setAttribute('data-lesson', lessonIdx);
      topicItem.setAttribute('data-topic', topicIdx);
      topicItem.style.display = 'flex';
      topicItem.style.alignItems = 'center';
      topicItem.style.gap = '8px';

      const key = `lesson${lessonIdx}.topic${topicIdx}`;
      const vIcon = document.createElement('span');
      vIcon.textContent = topic.locked ? '🔒' : '✔';
      vIcon.className = 'v-icon'; // אפס את כל המחלקות הקודמות

      if (topic.subtopics) {
        if (progressMap[key]) vIcon.classList.add('auto-enabled');
      } else {
        if (progressMap[key]) vIcon.classList.add('enabled');
      }

      vIcon.onclick = (e) => {
        e.stopPropagation();
        progressMap[key] = !progressMap[key];
        vIcon.classList.toggle('enabled', progressMap[key]);
        updateAutoChecks();
      };

      topicItem.appendChild(vIcon);

      const titleSpan = document.createElement('span');
      titleSpan.textContent = topic.title;
      titleSpan.classList.add('topic-title-text');
      topicItem.appendChild(titleSpan);

      topicItem.onclick = (e) => {
        if (e.target.classList.contains('v-icon')) return;
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
            subtopicItem.classList.add('topic-item');
            subtopicItem.style.display = 'flex';
            subtopicItem.style.alignItems = 'center';
            subtopicItem.style.gap = '8px';
            subtopicItem.style.marginLeft = '20px';

            const key = `lesson${lessonIdx}.topic${topicIdx}.sub${subIdx}`;
            const vIcon = document.createElement('span');
            vIcon.textContent = topic.locked ? '🔒' : '✔';
            vIcon.className = 'v-icon';
            if (progressMap[key]) vIcon.classList.add('enabled');

            vIcon.onclick = (e) => {
              e.stopPropagation();
              progressMap[key] = !progressMap[key];
              vIcon.classList.toggle('enabled', progressMap[key]);
              updateAutoChecks();
            };

            subtopicItem.appendChild(vIcon);

            const titleSpan = document.createElement('span');
            titleSpan.textContent = subtopic.title;
            subtopicItem.appendChild(titleSpan);

            subtopicItem.onclick = (e) => {
              if (e.target.classList.contains('v-icon')) return;
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








function renderProgressOverview() {
  const container = document.getElementById('lesson-progress-overview');
  container.innerHTML = ''; // איפוס קודם

  lessonsData.lessons.forEach((lesson, lessonIdx) => {
    const total = lesson.topics.reduce((sum, t) => sum + (t.subtopics ? t.subtopics.length : 1), 0);
    const completed = lesson.topics.reduce((sum, t, i) => {
      if (t.subtopics) {
        return sum + t.subtopics.filter((_, j) => progressMap[`lesson${lessonIdx}.topic${i}.sub${j}`]).length;
      } else {
        return sum + (progressMap[`lesson${lessonIdx}.topic${i}`] ? 1 : 0);
      }
    }, 0);

    const percent = total ? Math.round((completed / total) * 100) : 0;

    const block = document.createElement('div');
    block.classList.add('lesson-progress-container');

    const title = document.createElement('div');
    title.classList.add('lesson-title');
    title.textContent = `Lesson ${lessonIdx + 1}`;
    block.appendChild(title);

    const bar = document.createElement('div');
    bar.classList.add('progress-bar');

    const inner = document.createElement('div');
    inner.classList.add('progress-lessons');
    inner.style.width = `${percent}%`;
    bar.appendChild(inner);

    block.appendChild(bar);
    container.appendChild(block);
  });
}


function updateAutoChecks({ refreshLessons = false } = {}) {
  const newMap = {};

  // 🔒 שמירה על השיעור הפתוח
  const openLesson = document.querySelector('#lesson-list li.open');
  const openLessonIdx = openLesson ? Array.from(openLesson.parentElement.children).indexOf(openLesson) : null;

  function isSubtopicComplete(subtopicKey) {
    return !!progressMap[subtopicKey];
  }

  function isTopicComplete(lessonIdx, topicIdx, topic) {
    if (topic.subtopics && Array.isArray(topic.subtopics)) {
      return topic.subtopics.every((_, subIdx) =>
        isSubtopicComplete(`lesson${lessonIdx}.topic${topicIdx}.sub${subIdx}`)
      );
    } else {
      return !!progressMap[`lesson${lessonIdx}.topic${topicIdx}`];
    }
  }

  function isLessonComplete(lesson, lessonIdx) {
    return lesson.topics.every((topic, topicIdx) =>
      isTopicComplete(lessonIdx, topicIdx, topic)
    );
  }

  lessonsData.lessons.forEach((lesson, lessonIdx) => {
    lesson.topics.forEach((topic, topicIdx) => {
      if (isTopicComplete(lessonIdx, topicIdx, topic)) {
        newMap[`lesson${lessonIdx}.topic${topicIdx}`] = true;

        if (topic.subtopics) {
          topic.subtopics.forEach((_, subIdx) => {
            const key = `lesson${lessonIdx}.topic${topicIdx}.sub${subIdx}`;
            if (progressMap[key]) newMap[key] = true;
          });
        }
      } else {
        if (topic.subtopics) {
          topic.subtopics.forEach((_, subIdx) => {
            const key = `lesson${lessonIdx}.topic${topicIdx}.sub${subIdx}`;
            if (progressMap[key]) newMap[key] = true;
          });
        }
      }
    });

    if (isLessonComplete(lesson, lessonIdx)) {
      newMap[`lesson${lessonIdx}`] = true;
    }
  });

  Object.keys(progressMap).forEach(key => delete progressMap[key]);
  Object.assign(progressMap, newMap);
  localStorage.setItem("lessonProgress", JSON.stringify(progressMap));

  // 🔁 רינדור מותנה
  if (refreshLessons) {
    renderLessonList();

    // 📂 החזרת השיעור שנשאר פתוח
    if (openLessonIdx !== null) {
      const allLessonItems = document.querySelectorAll('#lesson-list > li');
      const reopened = allLessonItems[openLessonIdx];
      if (reopened) {
        reopened.classList.add('open');
        const ul = reopened.querySelector('ul');
        if (ul) ul.style.display = 'block';
      }
    }
  }

  // ✅ רענון סרגל התקדמות תמיד
  renderProgressOverview();
}




function highlightActiveTopic() {
  // הסרת הדגשה מכל הנושאים
  const allTopics = document.querySelectorAll('.topic-item');
  allTopics.forEach(item => item.classList.remove('active'));

  // הסרת הדגשה מכל כותרות ה־Lesson
  const allLessons = document.querySelectorAll('#lesson-list > li');
  allLessons.forEach(item => item.classList.remove('active-lesson'));

  // סימון הנושא הנבחר
  const selector = `.topic-item[data-lesson="${currentLessonIndex}"][data-topic="${currentTopicIndex}"]`;
  const currentItem = document.querySelector(selector);
  if (currentItem) {
    currentItem.classList.add('active');
  }

  // סימון כותרת ה־Lesson הנוכחי
  const lessonItems = document.querySelectorAll('#lesson-list > li');
  if (lessonItems[currentLessonIndex]) {
    lessonItems[currentLessonIndex].classList.add('active-lesson');
  }
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
  const outputElement = document.getElementById("output");
  const code = window.editor ? window.editor.getValue() : document.getElementById("code").value;
  outputElement.innerHTML = "";

  let capturedOutput = "";

  pyodide.setStdin({
    readline: () => {
      const input = prompt("📝 Please enter your input below:");
      if (input === null) throw new Error("User cancelled input.");
      return input;
    }
  });

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

  outputElement.innerHTML = "";
  capturedOutput.split(/\r?\n/).forEach(line => {
    const div = document.createElement("div");
    div.textContent = line;
    outputElement.appendChild(div);
  });
}




function copyCode() {
  const editor = window.editor;  // גישה לעריכת Monaco Editor
  const code = editor.getValue();  // קבלת הטקסט מה-Editor
  const confirmIcon = document.getElementById("copy-confirm");

  // ודא שיש תוכן להעתיק
  if (!code) {
    console.log("No code to copy!");
    return;
  }

  navigator.clipboard.writeText(code)
    .then(() => {
      if (confirmIcon) {
        confirmIcon.style.display = "inline";  // הצגת סימן הצלחה
        setTimeout(() => {
          confirmIcon.style.display = "none";  // הסתרת סימן הצלחה אחרי 3 שניות
        }, 3000);
      }
    })
    .catch(err => {
      console.error("Failed to copy code:", err);  // טיפול בשגיאות אם ההעתקה נכשלה
    });
}




function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('dark-mode');

  if (isDark) {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    monaco.editor.setTheme("vs");  // 🎨 מצב יום
  } else {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    monaco.editor.setTheme("vs-dark");  // 🌙 מצב לילה
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

// ✅ הפעלת הסקריפט כשנטען במסמך (במקום window.onload)
document.addEventListener("DOMContentLoaded", async () => {
  await startPyodideAndLoad();
});

// 📌 חשיפת פונקציות ל־HTML
window.runCode = runCode;
window.prevTopic = prevTopic;
window.nextTopic = nextTopic;
window.toggleSolution = toggleSolution;
window.toggleNeonColor = toggleNeonColor;
window.toggleTheme = toggleTheme;
window.copyCode = copyCode;
