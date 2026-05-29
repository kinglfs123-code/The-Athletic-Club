const STORAGE_KEY = "tac_app_state_v2";

const defaultState = {
  isLoggedIn: false,
  currentScreen: "login",
  theme: "dark",

  user: {
    name: "João Vitor Martins",
    initials: "JV",
    email: "",
  },

  onboarding: {
    focus: "Jiu-Jitsu",
    objective: "Performance",
    level: "Intermediário",
    frequency: "4x semana",
    timePerSession: "60 min",
    sleep: "7h",
    equipment: "Academia completa",
    restrictions: "Nenhuma",
  },

  workout: {
    completedSets: [],
    saved: false,
    finished: false,
  },

  nutrition: {
    checklist: {},
  },

  shop: {
    currentProduct: "Oversized",
    wishlist: [],
  },

  history: [],
};

let appState = loadState();
let timers = {};

const noNavScreens = [
  "login",
  "onboarding",
  "restrictions",
  "diagnosis",
  "loading",
];

const navMap = {
  home: 0,
  history: 0,
  training: 1,
  todayTraining: 1,
  nutrition: 2,
  nutritionChecklist: 2,
  shop: 3,
  product: 3,
  profile: 4,
};

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  applyTheme();
  bindNavigation();
  bindThemeButtons();
  bindLoginButtons();
  bindOnboarding();
  bindWorkoutSets();
  bindTimers();
  bindNutritionChecklist();
  bindShop();
  bindProfileActions();

  restoreWorkoutSets();
  renderAll();

  const startScreen = appState.isLoggedIn
    ? appState.currentScreen || "home"
    : "login";

  goTo(startScreen);
}

/* STATE */

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultState);

    const parsed = JSON.parse(saved);

    return deepMerge(structuredClone(defaultState), parsed);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  appState = structuredClone(defaultState);
  saveState();
  location.reload();
}

function deepMerge(target, source) {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }

  return target;
}

/* NAVIGATION */

function goTo(screenId, navButton = null) {
  const screen = document.getElementById(screenId);

  if (!screen) {
    console.warn(`Tela não encontrada: ${screenId}`);
    return;
  }

  document.querySelectorAll(".screen").forEach((item) => {
    item.classList.remove("active");
  });

  screen.classList.add("active");

  document.body.classList.toggle("hide-nav", noNavScreens.includes(screenId));
  document.body.classList.toggle("workout-mode", screenId === "todayTraining");

  updateNav(screenId, navButton);

  appState.currentScreen = screenId;
  saveState();

  screen.scrollTop = 0;
  renderAll();
}

function updateNav(screenId, navButton) {
  const buttons = document.querySelectorAll(".nav button");

  buttons.forEach((button) => button.classList.remove("active"));

  if (navButton) {
    navButton.classList.add("active");
    return;
  }

  const index = navMap[screenId];

  if (index !== undefined && buttons[index]) {
    buttons[index].classList.add("active");
  }
}

function bindNavigation() {
  window.goTo = goTo;
  window.toggleTheme = toggleTheme;
  window.selectOption = selectOption;
  window.saveWorkout = saveWorkout;
  window.finishWorkout = finishWorkout;
  window.resetState = resetState;

  document.querySelectorAll(".nav button").forEach((button, index) => {
    const screens = ["home", "training", "nutrition", "shop", "profile"];

    button.addEventListener("click", () => {
      goTo(screens[index], button);
    });
  });

  document.querySelectorAll(".list-item, .product, button").forEach((item) => {
    const text = normalize(item.textContent);

    if (text.includes("treino do dia")) {
      item.addEventListener("click", () => goTo("todayTraining"));
    }

    if (text.includes("checklist nutri")) {
      item.addEventListener("click", () => goTo("nutritionChecklist"));
    }

    if (text.includes("historico")) {
      item.addEventListener("click", () => goTo("history"));
    }
  });
}

/* LOGIN */

function bindLoginButtons() {
  document.querySelectorAll("button, .list-item").forEach((element) => {
    const text = normalize(element.textContent);

    if (text === "entrar" || text === "criar conta") {
      element.addEventListener("click", () => {
        if (!isActiveScreen("login")) return;

        appState.isLoggedIn = true;
        appState.currentScreen = "onboarding";
        saveState();

        goTo("onboarding");
      });
    }

    if (text.includes("entrar com apple")) {
      element.addEventListener("click", () => {
        fakeLogin("Apple");
      });
    }

    if (text.includes("entrar com google")) {
      element.addEventListener("click", () => {
        fakeLogin("Google");
      });
    }

    if (text.includes("recuperar acesso")) {
      element.addEventListener("click", () => {
        showToast("Recuperação simulada.");
      });
    }

    if (text.includes("sair")) {
      element.addEventListener("click", () => {
        appState.isLoggedIn = false;
        appState.currentScreen = "login";
        saveState();
        goTo("login");
        showToast("Sessão encerrada.");
      });
    }
  });
}

function fakeLogin(provider) {
  appState.isLoggedIn = true;
  appState.currentScreen = "home";
  saveState();
  goTo("home");
  showToast(`Login com ${provider} simulado.`);
}

/* THEME */

function bindThemeButtons() {
  document.querySelectorAll(".theme").forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });
}

function toggleTheme() {
  appState.theme = appState.theme === "light" ? "dark" : "light";
  applyTheme();
  saveState();
}

function applyTheme() {
  document.body.classList.toggle("light", appState.theme === "light");
}

/* ONBOARDING */

function bindOnboarding() {
  document.querySelectorAll("#onboarding .option").forEach((option) => {
    option.addEventListener("click", () => {
      selectOption(option);

      const title = option.querySelector(".option-title")?.textContent?.trim();

      if (title) {
        appState.onboarding.focus = title;
        saveState();
        renderDiagnosis();
      }
    });
  });

  document.querySelectorAll("button").forEach((button) => {
    const text = normalize(button.textContent);

    if (text.includes("continuar")) {
      button.addEventListener("click", () => {
        if (isActiveScreen("onboarding")) goTo("restrictions");
      });
    }

    if (text.includes("ver diagnostico")) {
      button.addEventListener("click", () => {
        if (isActiveScreen("restrictions")) goTo("diagnosis");
      });
    }

    if (text.includes("gerar plano")) {
      button.addEventListener("click", () => {
        if (isActiveScreen("diagnosis")) {
          goTo("loading");

          setTimeout(() => {
            goTo("home");
            showToast("Plano gerado.");
          }, 900);
        }
      });
    }

    if (text.includes("editar dados")) {
      button.addEventListener("click", () => goTo("onboarding"));
    }
  });
}

function selectOption(element) {
  const parent = element.closest(".screen");
  if (!parent) return;

  parent.querySelectorAll(".option").forEach((item) => {
    item.classList.remove("active");
  });

  element.classList.add("active");
}

function renderDiagnosis() {
  document.querySelectorAll(".list-item").forEach((item) => {
    const strong = item.querySelector("strong");
    const span = item.querySelector("span");

    if (!strong || !span) return;

    const label = normalize(strong.textContent);

    if (label === "foco") span.textContent = appState.onboarding.focus;
    if (label === "objetivo") span.textContent = appState.onboarding.objective;
    if (label === "dias") span.textContent = appState.onboarding.frequency;
    if (label === "tempo") span.textContent = appState.onboarding.timePerSession;
    if (label === "recuperacao") span.textContent = "Moderada";
  });
}

/* WORKOUT */

function bindWorkoutSets() {
  document.querySelectorAll(".set").forEach((button, index) => {
    const id = `set_${index + 1}`;
    button.dataset.setId = id;

    button.addEventListener("click", () => {
      toggleSet(id, button);
    });
  });
}

function toggleSet(id, button) {
  const exists = appState.workout.completedSets.includes(id);

  if (exists) {
    appState.workout.completedSets = appState.workout.completedSets.filter(
      (item) => item !== id
    );
    button.classList.remove("done");
  } else {
    appState.workout.completedSets.push(id);
    button.classList.add("done");
  }

  appState.workout.finished = false;
  saveState();
  renderWorkoutProgress();
}

function restoreWorkoutSets() {
  document.querySelectorAll(".set").forEach((button) => {
    const id = button.dataset.setId;

    if (appState.workout.completedSets.includes(id)) {
      button.classList.add("done");
    } else {
      button.classList.remove("done");
    }
  });
}

function renderWorkoutProgress() {
  const total = document.querySelectorAll(".set").length;
  const done = appState.workout.completedSets.length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");
  const heroPercent = document.getElementById("heroPercent");
  const heroRing = document.getElementById("heroRing");

  if (progressText) {
    progressText.textContent = `${done} de ${total} séries concluídas`;
  }

  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }

  if (heroPercent) {
    heroPercent.textContent = `${percent}%`;
  }

  if (heroRing) {
    heroRing.style.setProperty("--progress", percent);
  }

  renderHomeMetrics();
}

function saveWorkout() {
  appState.workout.saved = true;
  saveState();
  showToast("Registro salvo.");
}

function finishWorkout() {
  const total = document.querySelectorAll(".set").length;
  const done = appState.workout.completedSets.length;

  if (done < total) {
    showToast("Ainda há séries pendentes.");
    return;
  }

  const record = {
    id: Date.now(),
    date: new Date().toLocaleDateString("pt-BR"),
    title: "Força inferior + mobilidade",
    sets: `${done}/${total}`,
    status: "Completo",
  };

  appState.history.unshift(record);
  appState.workout.saved = true;
  appState.workout.finished = true;

  saveState();

  showToast("Treino finalizado.");

  setTimeout(() => {
    goTo("home");
  }, 900);
}

/* TIMERS */

function bindTimers() {
  document.querySelectorAll(".timer").forEach((box, index) => {
    const id = `timer_${index + 1}`;
    const display = box.querySelector(".timer-display");
    const start = box.querySelector(".start-timer");
    const reset = box.querySelector(".reset-timer");

    if (!display || !start || !reset) return;

    const initial = Number(display.dataset.time || 0);

    timers[id] = {
      initial,
      remaining: initial,
      interval: null,
      running: false,
      display,
      start,
    };

    display.textContent = formatTime(initial);

    start.addEventListener("click", () => toggleTimer(id));
    reset.addEventListener("click", () => resetTimer(id));
  });
}

function toggleTimer(id) {
  const timer = timers[id];
  if (!timer) return;

  if (!timer.running) {
    timer.running = true;
    timer.start.textContent = "Pause";

    timer.interval = setInterval(() => {
      timer.remaining--;

      if (timer.remaining <= 0) {
        timer.remaining = 0;
        timer.display.textContent = formatTime(0);
        clearInterval(timer.interval);
        timer.running = false;
        timer.start.textContent = "Start";
        showToast("Timer concluído.");
        return;
      }

      timer.display.textContent = formatTime(timer.remaining);
    }, 1000);

    return;
  }

  clearInterval(timer.interval);
  timer.running = false;
  timer.start.textContent = "Start";
}

function resetTimer(id) {
  const timer = timers[id];
  if (!timer) return;

  clearInterval(timer.interval);
  timer.running = false;
  timer.remaining = timer.initial;
  timer.display.textContent = formatTime(timer.initial);
  timer.start.textContent = "Start";
}

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return `${minutes}:${secs}`;
}

/* NUTRITION */

function bindNutritionChecklist() {
  const screen = document.getElementById("nutritionChecklist");
  if (!screen) return;

  screen.querySelectorAll(".list-item").forEach((item, index) => {
    const id = `nutrition_${index + 1}`;
    item.dataset.nutritionId = id;

    if (appState.nutrition.checklist[id] === undefined) {
      const strong = item.querySelector("strong");
      appState.nutrition.checklist[id] = strong?.textContent.trim() === "✓";
    }

    item.addEventListener("click", () => {
      toggleNutrition(id, item);
    });
  });

  saveState();
}

function toggleNutrition(id, item) {
  appState.nutrition.checklist[id] = !appState.nutrition.checklist[id];

  const strong = item.querySelector("strong");

  if (strong) {
    strong.textContent = appState.nutrition.checklist[id] ? "✓" : "—";
  }

  saveState();
  renderNutrition();
}

function renderNutrition() {
  const screen = document.getElementById("nutritionChecklist");
  if (!screen) return;

  screen.querySelectorAll(".list-item").forEach((item) => {
    const id = item.dataset.nutritionId;
    const strong = item.querySelector("strong");

    if (!strong || !id) return;

    strong.textContent = appState.nutrition.checklist[id] ? "✓" : "—";
  });

  renderHomeMetrics();
}

/* SHOP */

function bindShop() {
  document.querySelectorAll(".product").forEach((product) => {
    product.addEventListener("click", () => {
      const title =
        product.querySelector(".option-title")?.textContent.trim() || "Produto";

      appState.shop.currentProduct = title;
      saveState();

      renderProduct();
      goTo("product");
    });
  });

  document.querySelectorAll("#product .list-item").forEach((item) => {
    const text = normalize(item.textContent);

    if (text.includes("wishlist")) {
      item.addEventListener("click", () => {
        toggleWishlist(appState.shop.currentProduct);
      });
    }
  });
}

function toggleWishlist(product) {
  const exists = appState.shop.wishlist.includes(product);

  if (exists) {
    appState.shop.wishlist = appState.shop.wishlist.filter(
      (item) => item !== product
    );
    showToast("Removido da wishlist.");
  } else {
    appState.shop.wishlist.push(product);
    showToast("Adicionado à wishlist.");
  }

  saveState();
  renderProduct();
}

function renderProduct() {
  const screen = document.getElementById("product");
  if (!screen) return;

  const title = appState.shop.currentProduct || "Produto";
  const titleElement = screen.querySelector(".hero h2");

  if (titleElement) {
    titleElement.textContent = title;
  }

  screen.querySelectorAll(".list-item").forEach((item) => {
    const strong = item.querySelector("strong");
    const span = item.querySelector("span");

    if (!strong || !span) return;

    if (normalize(strong.textContent) === "status") {
      span.textContent = appState.shop.wishlist.includes(title)
        ? "Na wishlist"
        : "Adicionar";
    }
  });
}

/* PROFILE */

function bindProfileActions() {
  document.querySelectorAll("#profile .list-item").forEach((item) => {
    const text = normalize(item.textContent);

    if (text.includes("resetar plano")) {
      item.addEventListener("click", () => {
        appState.workout = structuredClone(defaultState.workout);
        appState.nutrition = structuredClone(defaultState.nutrition);
        appState.history = [];
        saveState();
        restoreWorkoutSets();
        renderAll();
        showToast("Plano resetado.");
      });
    }

    if (text.includes("exportar dados")) {
      item.addEventListener("click", exportData);
    }
  });
}

function exportData() {
  const data = JSON.stringify(appState, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "tac-app-data.json";
  link.click();

  URL.revokeObjectURL(url);
  showToast("Dados exportados.");
}

/* RENDER */

function renderAll() {
  renderDiagnosis();
  renderWorkoutProgress();
  renderNutrition();
  renderProduct();
  renderHistory();
  renderProfile();
}

function renderHomeMetrics() {
  const totalSets = document.querySelectorAll(".set").length;
  const completedSets = appState.workout.completedSets.length;
  const workoutPercent = totalSets
    ? Math.round((completedSets / totalSets) * 100)
    : 0;

  const nutritionValues = Object.values(appState.nutrition.checklist);
  const nutritionPercent = nutritionValues.length
    ? Math.round(
        (nutritionValues.filter(Boolean).length / nutritionValues.length) * 100
      )
    : 0;

  document.querySelectorAll(".metric").forEach((metric) => {
    const label = metric.querySelector(".label");
    const value = metric.querySelector(".value");

    if (!label || !value) return;

    const key = normalize(label.textContent);

    if (key === "treinos") {
      value.textContent =
        workoutPercent === 100 ? "1/1" : `${completedSets}/${totalSets}`;
    }

    if (key === "proteina") {
      value.textContent = `${nutritionPercent}%`;
    }
  });
}

function renderHistory() {
  const screen = document.getElementById("history");
  if (!screen) return;

  const list = screen.querySelector(".list");
  if (!list) return;

  if (!appState.history.length) {
    list.innerHTML = `
      <div class="list-item">
        <strong>Vazio</strong>
        <span>Nenhum treino finalizado</span>
      </div>
    `;
    return;
  }

  list.innerHTML = appState.history
    .map(
      (item) => `
      <div class="list-item">
        <strong>${item.date}</strong>
        <span>${item.title} · ${item.sets}</span>
      </div>
    `
    )
    .join("");
}

function renderProfile() {
  const avatar = document.querySelector(".avatar");
  if (avatar) avatar.textContent = appState.user.initials;

  document.querySelectorAll("#profile .list-item").forEach((item) => {
    const strong = item.querySelector("strong");
    const span = item.querySelector("span");

    if (!strong || !span) return;

    const label = normalize(strong.textContent);

    if (label === "foco") span.textContent = appState.onboarding.focus;
    if (label === "objetivo") span.textContent = appState.onboarding.objective;
  });
}

/* UTILS */

function isActiveScreen(id) {
  return document.getElementById(id)?.classList.contains("active");
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function showToast(message) {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 1700);
}
