// ── Data ──────────────────────────────────────────────────────────────────────

const locations = [
  { name: "The Whispering Glade", emoji: "🌿" },
  { name: "The Lantern Bridge", emoji: "🏮" },
  { name: "The Silver Falls", emoji: "💧" },
  { name: "The Mossy Archive", emoji: "📜" },
  { name: "The Ember Hollow", emoji: "🔥" },
  { name: "The Moonlit Tower", emoji: "🌙" },
  { name: "The Crystal Cavern", emoji: "💎" },
  { name: "The Shepherd's Ridge", emoji: "⛰️" },
  { name: "The Sunken Library", emoji: "📚" },
  { name: "The Amber Gate", emoji: "🚪" },
  { name: "The Fern Cathedral", emoji: "🌲" },
  { name: "The Starfall Meadow", emoji: "✨" },
  { name: "The Iron Hearth", emoji: "⚒️" },
  { name: "The Driftwood Cove", emoji: "🐚" },
  { name: "The Winding Stair", emoji: "🗝️" },
];

const journeyNames = [
  "The Path of Echoing Strings",
  "Through the Vale of Resonance",
  "The Passage of Gentle Thunder",
  "Across the Harmonic Wilds",
  "The Road to the Singing Peaks",
  "Into the Valley of First Light",
  "The Trail of Forgotten Melodies",
  "Beyond the River of Rhythm",
];

let quests = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── API ───────────────────────────────────────────────────────────────────────

async function generateQuestNarration(task, locationName) {
  const response = await fetch('/api/narrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, locationName }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return await response.json();
}

function generateFallbackNarration(task, locationName) {
  const templates = [
    `The ancient scores in ${locationName} can only be read by those who ${task.toLowerCase()}. The trees lean in to listen.`,
    `A weathered sign at the entrance reads: "Only those who ${task.toLowerCase()} may pass." The path glows faintly ahead.`,
    `The keeper of ${locationName} has set a trial: ${task.toLowerCase()}. Complete it, and the way forward opens.`,
    `Mist clings to ${locationName}. Through it, a melody drifts — it sounds like someone who once dared to ${task.toLowerCase()}. You understand what must be done.`,
    `Carved into the stone archway: "Let the one who ${task.toLowerCase()} enter freely." You take a breath and begin.`,
  ];
  return {
    questTitle: `Trial of ${locationName.split(' ').slice(-1)[0]}`,
    flavourText: pickRandom(templates),
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

function addTask() {
  const taskList = document.getElementById('taskList');
  const entry = document.createElement('div');
  entry.className = 'task-entry';
  entry.innerHTML = `
    <input type="text" placeholder="e.g. Another practice task…" class="task-input" />
    <button class="btn-remove-task" onclick="removeTask(this)" title="Remove">×</button>
  `;
  taskList.appendChild(entry);
  entry.querySelector('input').focus();
  checkBeginButton();
}

function removeTask(btn) {
  const entries = document.querySelectorAll('.task-entry');
  if (entries.length > 1) {
    btn.parentElement.remove();
    checkBeginButton();
  }
}

function checkBeginButton() {
  const inputs = document.querySelectorAll('.task-input');
  const hasValue = Array.from(inputs).some(i => i.value.trim());
  document.getElementById('btnBegin').disabled = !hasValue;
}

// ── Journey ───────────────────────────────────────────────────────────────────

async function beginJourney() {
  const inputs = document.querySelectorAll('.task-input');
  const tasks = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
  if (tasks.length === 0) return;

  const shuffledLocs = shuffle(locations);
  const journeyName = pickRandom(journeyNames);
  document.getElementById('weekTitle').textContent = journeyName;

  const loadingProgress = document.getElementById('loadingProgress');
  loadingProgress.innerHTML = tasks.map((task, i) => `
    <div class="loading-task-item" id="loadItem${i}">
      <div class="loading-task-dot"></div>
      <span>${task}</span>
    </div>
  `).join('');

  document.getElementById('setupScreen').classList.remove('active');
  document.getElementById('loadingScreen').classList.add('active');

  const questData = [];

  for (let i = 0; i < tasks.length; i++) {
    const item = document.getElementById(`loadItem${i}`);
    if (item) item.classList.add('active');

    const loc = shuffledLocs[i % shuffledLocs.length];

    try {
      // Minimum 1.2s per quest so the loading ritual feels deliberate
      const [narration] = await Promise.all([
        generateQuestNarration(tasks[i], loc.name),
        new Promise(r => setTimeout(r, 1200)),
      ]);
      questData.push({
        id: i,
        task: tasks[i],
        location: loc,
        questTitle: narration.questTitle,
        flavour: narration.flavourText,
        completed: false,
      });
    } catch (err) {
      console.warn('Narration error, using fallback:', err);
      await new Promise(r => setTimeout(r, 1200));
      const fallback = generateFallbackNarration(tasks[i], loc.name);
      questData.push({
        id: i,
        task: tasks[i],
        location: loc,
        questTitle: fallback.questTitle,
        flavour: fallback.flavourText,
        completed: false,
      });
    }

    if (item) { item.classList.remove('active'); item.classList.add('done'); }

    // Pause between tasks so each completion registers visually
    await new Promise(r => setTimeout(r, 800));
  }

  quests = questData;
  document.getElementById('loadingScreen').classList.remove('active');
  document.getElementById('journeyScreen').classList.add('active');
  renderJourney();
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderJourney() {
  const path = document.getElementById('journeyPath');
  const completedCount = quests.filter(q => q.completed).length;
  const firstIncomplete = quests.findIndex(q => !q.completed);
  const allComplete = completedCount === quests.length;

  const pct = quests.length > 0 ? (completedCount / quests.length) * 100 : 0;
  document.getElementById('progressText').textContent = `${completedCount} of ${quests.length} quests complete`;
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('journeyComplete').style.display = allComplete ? 'block' : 'none';

  path.querySelectorAll('.quest-card').forEach(el => el.remove());

  quests.forEach((quest, i) => {
    const status = quest.completed ? 'completed' : (i === firstIncomplete ? 'current' : 'locked');
    const card = document.createElement('div');
    card.className = `quest-card ${status}`;

    let statusHTML = '';
    if (status === 'completed') {
      statusHTML = `<div class="quest-status">✓ Quest complete</div>`;
    } else if (status === 'current') {
      statusHTML = `<button class="quest-complete-btn" onclick="completeQuest(${quest.id}, event)">✦ Mark Complete</button>`;
    } else {
      statusHTML = `<div class="quest-status" style="color: var(--mist);">🔒 Locked</div>`;
    }

    card.innerHTML = `
      <div class="quest-node">${quest.completed ? '✓' : quest.location.emoji}</div>
      <div class="quest-card-inner">
        <div class="quest-location">${quest.location.name}</div>
        <div class="quest-name">${quest.questTitle}</div>
        <div class="quest-flavour">${quest.flavour}</div>
        <div class="quest-original-task">📋 ${quest.task}</div>
        ${statusHTML}
      </div>
    `;

    path.appendChild(card);
  });
}

// ── Complete ──────────────────────────────────────────────────────────────────

function completeQuest(id, event) {
  event.stopPropagation();
  const quest = quests.find(q => q.id === id);
  if (!quest) return;
  quest.completed = true;
  createSparkles(event.clientX, event.clientY);
  renderJourney();
}

function createSparkles(x, y) {
  const container = document.getElementById('sparkleContainer');
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.style.left = (x + (Math.random() - 0.5) * 70) + 'px';
    s.style.top = (y + (Math.random() - 0.5) * 35) + 'px';
    s.style.animationDelay = (Math.random() * 0.3) + 's';
    s.style.background = Math.random() > 0.5 ? 'var(--gold-glow)' : 'var(--gold)';
    container.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
}

// ── Reset ─────────────────────────────────────────────────────────────────────

function resetJourney() {
  quests = [];
  document.getElementById('journeyScreen').classList.remove('active');
  document.getElementById('loadingScreen').classList.remove('active');
  document.getElementById('setupScreen').classList.add('active');
  document.getElementById('journeyComplete').style.display = 'none';
  document.getElementById('weekTitle').textContent = '';

  document.getElementById('taskList').innerHTML = `
    <div class="task-entry">
      <input type="text" placeholder="e.g. Minuet in G, bars 12–20, hands separate" class="task-input" />
      <button class="btn-remove-task" onclick="removeTask(this)" title="Remove">×</button>
    </div>
    <div class="task-entry">
      <input type="text" placeholder="e.g. C major scale, two octaves" class="task-input" />
      <button class="btn-remove-task" onclick="removeTask(this)" title="Remove">×</button>
    </div>
    <div class="task-entry">
      <input type="text" placeholder="e.g. Sight-read a new piece" class="task-input" />
      <button class="btn-remove-task" onclick="removeTask(this)" title="Remove">×</button>
    </div>
  `;
  checkBeginButton();
}

// ── Events ────────────────────────────────────────────────────────────────────

document.addEventListener('input', (e) => {
  if (e.target.classList.contains('task-input')) checkBeginButton();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList.contains('task-input')) {
    e.preventDefault();
    const inputs = Array.from(document.querySelectorAll('.task-input'));
    const idx = inputs.indexOf(e.target);
    if (idx === inputs.length - 1) addTask();
    else inputs[idx + 1].focus();
  }
});