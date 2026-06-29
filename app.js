function createWordCard(item) {
  return `
    <div class="card">
      <div class="tag">${item.category}</div>
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

  const filtered = words.filter(item => item.category === category);
  renderWordList(filtered);
}

window.addEventListener("load", () => {
  renderCategoryButtons();
  renderWordList();
  pickWords();
});
