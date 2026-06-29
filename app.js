let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let weakWords = JSON.parse(localStorage.getItem("weakWords") || "[]");
let quizCount = Number(localStorage.getItem("quizCount") || "0");
let currentQuiz = null;

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateStats();
}

function saveWeakWords() {
  localStorage.setItem("weakWords", JSON.stringify(weakWords));
  updateStats();
}

function saveQuizCount() {
  localStorage.setItem("quizCount", String(quizCount));
  updateStats();
}

function updateStats() {
  document.getElementById("totalCount").textContent = words.length;
  document.getElementById("favoriteCount").textContent = favorites.length;
  document.getElementById("weakCount").textContent = weakWords.length;
  document.getElementById("quizCount").textContent = quizCount;
}

function toggleFavorite(word) {
  if (favorites.includes(word)) {
    favorites = favorites.filter(item => item !== word);
  } else {
    favorites.push(word);
  }

  saveFavorites();
  refreshVisibleAreas();
}

function createWordCard(item) {
  const star = favorites.includes(item.word) ? "★" : "☆";

  return `
    <div class="card">
      <div class="card-top">
        <div class="tag">${item.category}</div>
        <button class="small star" onclick="toggleFavorite('${item.word}')">${star}</button>
      </div>
      <div class="word">${item.word}</div>
      <div class="zhuyin">${item.zhuyin}</div>
      <div class="meaning">${item.meaning}</div>
      <div class="example">
        ${item.example}<br>
        <span style="color:#666;">${item.exampleZhuyin}</span><br>
        <span class="note">${item.note}</span>
      </div>
    </div>
  `;
}

function renderWordList(targetWords = words) {
  document.getElementById("wordList").innerHTML =
    targetWords.length > 0
      ? targetWords.map(createWordCard).join("")
      : '<div class="empty">找不到耶 🥲</div>';
}

function pickWords() {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);
  document.getElementById("todayWords").innerHTML =
    selected.map(createWordCard).join("");
}

function clearTodayWords() {
  document.getElementById("todayWords").innerHTML = "";
}

function searchWords() {
  const keyword = document.getElementById("searchInput").value.trim();
  const results = document.getElementById("searchResults");

  if (!keyword) {
    results.innerHTML = "";
    return;
  }

  const matched = words.filter(item =>
    item.category.includes(keyword) ||
    item.word.includes(keyword) ||
    item.zhuyin.includes(keyword) ||
    item.meaning.includes(keyword) ||
    item.note.includes(keyword) ||
    item.example.includes(keyword) ||
    item.exampleZhuyin.includes(keyword)
  );

  results.innerHTML =
    matched.length > 0
      ? matched.map(createWordCard).join("")
      : '<div class="empty">找不到耶 🥲</div>';
}

function renderCategoryButtons() {
  const categories = ["全部", ...new Set(words.map(item => item.category))];

  document.getElementById("categoryButtons").innerHTML =
    categories.map(category => `
      <button class="secondary small" onclick="filterByCategory('${category}')">
        ${category}
      </button>
    `).join("");
}

function filterByCategory(category) {
  if (category === "全部") {
    renderWordList(words);
    return;
  }

  renderWordList(words.filter(item => item.category === category));
}

function showFavorites() {
  renderWordList(words.filter(item => favorites.includes(item.word)));
}

function showWeakWords() {
  renderWordList(words.filter(item => weakWords.includes(item.word)));
}

function clearWeakWords() {
  if (!confirm("苦手單字リストを消す？")) return;
  weakWords = [];
  saveWeakWords();
  renderWordList(words);
}

function startQuiz() {
  const question = words[Math.floor(Math.random() * words.length)];
  const answers = [question.meaning];

  while (answers.length < 4) {
    const randomMeaning = words[Math.floor(Math.random() * words.length)].meaning;
    if (!answers.includes(randomMeaning)) answers.push(randomMeaning);
  }

  answers.sort(() => Math.random() - 0.5);
  currentQuiz = question;
  quizCount += 1;
  saveQuizCount();

  document.getElementById("quizArea").innerHTML = `
    <div class="quiz-card">
      <div class="tag">${question.category}</div>
      <div class="word">${question.word}</div>
      <div class="zhuyin">${question.zhuyin}</div>
      <p class="hint">この意味はどれ？</p>
      <div class="quiz-options">
        ${answers.map(answer => `
          <button onclick="checkAnswer('${escapeText(answer)}')">${answer}</button>
        `).join("")}
      </div>
      <div id="quizResult"></div>
    </div>
  `;
}

function checkAnswer(answer) {
  if (!currentQuiz) return;

  const result = document.getElementById("quizResult");

  if (answer === currentQuiz.meaning) {
    result.innerHTML = `
      <div class="quiz-result">
        <span class="correct">⭕ 正解！</span><br>
        ${currentQuiz.example}<br>
        ${currentQuiz.exampleZhuyin}
      </div>
    `;
  } else {
    if (!weakWords.includes(currentQuiz.word)) {
      weakWords.push(currentQuiz.word);
      saveWeakWords();
    }

    result.innerHTML = `
      <div class="quiz-result">
        <span class="wrong">❌ 不正解</span><br>
        正解：${currentQuiz.meaning}<br>
        ${currentQuiz.example}<br>
        ${currentQuiz.exampleZhuyin}
      </div>
    `;
  }
}

function clearQuiz() {
  document.getElementById("quizArea").innerHTML = "";
  currentQuiz = null;
}

function escapeText(text) {
  return text.replace(/'/g, "\\'");
}

function refreshVisibleAreas() {
  renderWordList(words);
  searchWords();

  const todayArea = document.getElementById("todayWords");
  if (todayArea.innerHTML.trim() !== "") {
    const todayWords = [...todayArea.querySelectorAll(".word")].map(el => el.textContent);
    const items = words.filter(item => todayWords.includes(item.word));
    todayArea.innerHTML = items.map(createWordCard).join("");
  }
}

window.addEventListener("load", () => {
  renderCategoryButtons();
  renderWordList();
  pickWords();
  updateStats();
});
