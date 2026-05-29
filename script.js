const noNav = ['login', 'onboarding', 'restrictions', 'diagnosis', 'loading'];
const navMap = {
  home: 0,
  training: 1,
  todayTraining: 1,
  nutrition: 2,
  nutritionChecklist: 2,
  shop: 3,
  product: 3,
  profile: 4,
  history: 0
};

const workoutBlocks = [
  {
    number: '01',
    title: 'Aquecimento',
    meta: 'Ativação geral · 8 min',
    time: 480,
    label: 'timer',
    exercises: [
      { name: 'Bike / Remo leve', desc: 'Subir temperatura sem fadigar.', badge: '5 min', sets: 1 },
      { name: 'Mobilidade de quadril', desc: 'Dinâmica e controlada.', badge: '3 min', sets: 1 }
    ]
  },
  {
    number: '02',
    title: 'Força principal',
    meta: 'Carga moderada · descanso controlado',
    time: 1500,
    label: 'bloco',
    exercises: [
      { name: 'Agachamento livre', desc: '4 séries · 5 reps · potência e técnica.', badge: '4x5', sets: 4 },
      { name: 'Terra romeno', desc: '3 séries · 8 reps · posterior e estabilidade.', badge: '3x8', sets: 3 }
    ]
  },
  {
    number: '03',
    title: 'Acessórios',
    meta: 'Controle · volume · core',
    time: 900,
    label: 'bloco',
    exercises: [
      { name: 'Avanço alternado', desc: '3 séries · 10 reps cada lado.', badge: '3x10', sets: 3 },
      { name: 'Prancha frontal', desc: '3 séries · 40 segundos.', badge: '3x40s', sets: 3 }
    ]
  },
  {
    number: '04',
    title: 'Volta à calma',
    meta: 'Respiração + mobilidade final',
    time: 420,
    label: 'final',
    exercises: [
      { name: 'Mobilidade final', desc: 'Quadril, tornozelo e lombar.', badge: '4 min', sets: 1 },
      { name: 'Respiração nasal', desc: 'Baixar frequência e finalizar.', badge: '3 min', sets: 1 }
    ]
  }
];

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderWorkoutBlocks() {
  const root = document.getElementById('workoutBlocks');
  if (!root) return;

  root.innerHTML = workoutBlocks.map((block) => `
    <div class="glass workout-block">
      <div class="inner">
        <div class="block-header">
          <div>
            <div class="label">Bloco ${block.number}</div>
            <div class="block-title">${block.title}</div>
            <div class="block-meta">${block.meta}</div>
          </div>
          <div class="timer">
            <strong class="timer-display" data-time="${block.time}">${formatTime(block.time)}</strong>
            <span>${block.label}</span>
            <div class="timer-actions">
              <button class="mini-btn start-timer">Start</button>
              <button class="mini-btn reset-timer">Reset</button>
            </div>
          </div>
        </div>
        <div class="exercise-list">
          ${block.exercises.map((exercise) => `
            <div class="exercise">
              <div class="exercise-top">
                <div>
                  <div class="exercise-name">${exercise.name}</div>
                  <div class="exercise-desc">${exercise.desc}</div>
                </div>
                <div class="badge">${exercise.badge}</div>
              </div>
              <div class="sets">
                ${Array.from({ length: exercise.sets }).map((_, index) => `<button class="set"><span>${index + 1}</span></button>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');

  bindSets();
  bindTimers();
  updateProgress();
}

function goTo(id, navButton = null) {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  document.body.classList.toggle('hide-nav', noNav.includes(id));
  document.body.classList.toggle('workout-mode', id === 'todayTraining');

  document.querySelectorAll('.nav button').forEach((button) => button.classList.remove('active'));

  if (navButton) {
    navButton.classList.add('active');
  } else if (navMap[id] !== undefined) {
    document.querySelectorAll('.nav button')[navMap[id]].classList.add('active');
  }

  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen) activeScreen.scrollTop = 0;

  localStorage.setItem('tac:lastScreen', id);
  updateProgress();
}

function toggleTheme() {
  document.body.classList.toggle('light');
  localStorage.setItem('tac:theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

function selectOption(el) {
  document.querySelectorAll('#onboarding .option').forEach((option) => option.classList.remove('active'));
  el.classList.add('active');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1700);
}

function bindSets() {
  document.querySelectorAll('.set').forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.toggle('done');
      saveSetState();
      updateProgress();
    });
  });
  loadSetState();
}

function saveSetState() {
  const states = Array.from(document.querySelectorAll('.set')).map((button) => button.classList.contains('done'));
  localStorage.setItem('tac:sets', JSON.stringify(states));
}

function loadSetState() {
  const raw = localStorage.getItem('tac:sets');
  if (!raw) return;
  try {
    const states = JSON.parse(raw);
    document.querySelectorAll('.set').forEach((button, index) => {
      button.classList.toggle('done', Boolean(states[index]));
    });
  } catch (_) {}
}

function updateProgress() {
  const sets = document.querySelectorAll('.set');
  const total = sets.length || 1;
  const done = document.querySelectorAll('.set.done').length;
  const pct = Math.round((done / total) * 100);

  const progressText = document.getElementById('progressText');
  const progressBar = document.getElementById('progressBar');
  const heroPercent = document.getElementById('heroPercent');
  const heroRing = document.getElementById('heroRing');

  if (progressText) progressText.textContent = `${done} de ${total} séries concluídas`;
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (heroPercent) heroPercent.textContent = `${pct}%`;
  if (heroRing) heroRing.style.setProperty('--progress', pct);
}

function bindTimers() {
  document.querySelectorAll('.timer').forEach((box) => {
    const display = box.querySelector('.timer-display');
    const start = box.querySelector('.start-timer');
    const reset = box.querySelector('.reset-timer');
    const initial = Number(display.dataset.time);
    let remaining = initial;
    let timer = null;
    let running = false;

    display.textContent = formatTime(remaining);

    start.addEventListener('click', () => {
      if (!running) {
        running = true;
        start.textContent = 'Pause';
        timer = setInterval(() => {
          if (remaining > 0) {
            remaining--;
            display.textContent = formatTime(remaining);
          } else {
            clearInterval(timer);
            running = false;
            start.textContent = 'Start';
            showToast('Timer concluído.');
          }
        }, 1000);
      } else {
        clearInterval(timer);
        running = false;
        start.textContent = 'Start';
      }
    });

    reset.addEventListener('click', () => {
      clearInterval(timer);
      running = false;
      remaining = initial;
      display.textContent = formatTime(remaining);
      start.textContent = 'Start';
    });
  });
}

function saveWorkout() {
  saveSetState();
  showToast('Registro salvo.');
}

function finishWorkout() {
  const total = document.querySelectorAll('.set').length;
  const done = document.querySelectorAll('.set.done').length;
  if (done < total) {
    showToast('Ainda há séries pendentes.');
    return;
  }
  showToast('Treino finalizado.');
  setTimeout(() => goTo('home'), 900);
}

function boot() {
  renderWorkoutBlocks();
  const theme = localStorage.getItem('tac:theme');
  if (theme === 'light') document.body.classList.add('light');
}

boot();
