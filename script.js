/* THE ATHLETIC CLUB — APP FUNCTIONAL SCRIPT */

const STORAGE_KEY = "tac_app_state_v1";

const defaultState = {
  theme: "dark",
  currentScreen: "login",
  onboarding: {
    focus: "Musculação",
    objective: "Performance",
    level: "Intermediário",
    frequency: "4x semana",
    time: "60 min"
  },
  workout: {
    completedSets: [],
    saved: false,
    finished: false
  },
  nutrition: {
    checklist: {
      breakfast: true,
      lunch: true,
      preworkout: false,
      dinner: false,
      water: false
    }
  },
  shop: {
    wishlist: []
  }
};

let state = loadState();
let timers = {};

const noNavScreens = [
  "login",
  "onboarding",
  "restrictions",
  "diagnosis",
  "loading"
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

  profile: 4
};

/* INIT */

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  bindGlobalClicks();
  bindNavigation();
  bindOnboarding();
  bindWorkout();
  bindTimers();
  bindNutrition();
  bindShop();
  restoreWorkoutProgress();

  goTo(state.currentScreen || "login");
});

/* STATE */

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(defaultState);
  applyTheme();
  restoreWorkoutProgress();
  goTo("login");
  showToast("App reiniciado.");
}

/* NAVIGATION */

function goTo(id, navButton = null) {
  const target = document.getElementById(id);

  if (!target) {
    console.warn(`Tela não encontrada: ${id}`);
    return;
  }

  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  target.classList.add("active");

  document.body.classList.toggle("hide-nav", noNavScreens.includes(id));
  document.body.classList.toggle("workout-mode", id === "todayTraining");

  updateNavState(id, navButton);

  state.currentScreen = id;
  saveState();

  target.scrollTop = 0;
  updateProgress();
}

function updateNavState(id, navButton) {
  const navButtons = document.querySelectorAll(".nav button");

  navButtons.forEach(button => {
    button.classList.remove("active");
  });

  if (navButton) {
    navButton.classList.add("active");
    return;
  }

  if (navMap[id] !== undefined && navButtons[navMap[id]]) {
    navButtons[navMap[id]].classList.add("active");
  }
}

function bindNavigation() {
  document.querySelectorAll("[data-screen]").forEach(element => {
    element.addEventListener("click", () => {
      goTo(element.dataset.screen);
    });
  });
}

/* THEME */

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  applyTheme();
  saveState();
}

function applyTheme() {
  document.body.classList.toggle("light", state.theme === "light");
}

/* GLOBAL BUTTONS */

function bindGlobalClicks() {
  window.goTo = goTo;
  window.toggleTheme = toggleTheme;
  window.selectOption = selectOption;
  window.saveWorkout = saveWorkout;
  window.finishWorkout = finishWorkout;
  window.resetState = resetState;

  document.querySelectorAll(".theme").forEach(button => {
    button.addEventListener("click", toggleTheme);
  });

  document.querySelectorAll(".btn, .list-item, .product, .option").forEach(element => {
    element.addEventListener("touchstart", () => {}, { passive: true });
  });

  bindTextButtons();
}

function bindTextButtons() {
  document.querySelectorAll("button, .list-item").forEach(element => {
    const text = normalizeText(element.textContent);

    if (text.includes("entrar") || text.includes("criar conta")) {
      element.addEventListener("click", () => {
        if (document.getElementById("login")?.classList.contains("active")) {
          goTo("onboarding");
        }
      });
    }

    if (text.includes("continuar")) {
      element.addEventListener("click", () => {
        if (document.getElementById("onboarding")?.classList.contains("active")) {
          goTo("restrictions");
        }
      });
    }

    if (text.includes("ver diagnostico")) {
      element.addEventListener("click", () => goTo("diagnosis"));
    }

    if (text.includes("gerar plano")) {
      element.addEventListener("click", () => {
        goTo("loading");

        setTimeout(() => {
          goTo("home");
          showToast("Plano gerado.");
        }, 900);
      });
    }

    if (text.includes("editar dados")) {
      element.addEventListener("click", () => goTo("onboarding"));
    }

    if (text.includes("sair")) {
      element.addEventListener("click", () => goTo("login"));
    }
  });
}

/* ONBOARDING */

function bindOnboarding() {
  document.querySelectorAll("#onboarding .option").forEach(option => {
    option.addEventListener("click", () => {
      selectOption(option);

      const title = option.querySelector(".option-title")?.textContent?.trim();

      if (title) {
        state.onboarding.focus = title;
        updateUserFocusText();
        saveState();
      }
    });
  });

  updateUserFocusText();
}

function selectOption(element) {
  const parentScreen = element.closest(".screen");

  if (!parentScreen) return;

  parentScreen.querySelectorAll(".option").forEach(option => {
    option.classList.remove("active");
  });

  element.classList.add("active");
}

function updateUserFocusText() {
  document.querySelectorAll(".list-item").forEach(item => {
    const strong = item.querySelector("strong");
    const span = item.querySelector("span");

    if (!strong || !span) return;

    const label = normalizeText(strong.textContent);

    if (label === "foco") {
      span.textContent = state.onboarding.focus;
    }

    if (label === "objetivo") {
      span.textContent = state.onboarding.objective;
    }
  });
}

/* WORKOUT */

function bindWorkout() {
  document.querySelectorAll(".set").forEach((button, index) => {
    button.dataset.setId = button.dataset.setId || `set_${index + 1}`;

    button.addEventListener("click", () => {
      const setId = button.dataset.setId;

      button.classList.toggle("done");

      if (button.classList.contains("done")) {
        if (!state.workout.completedSets.includes(setId)) {
          state.workout.completedSets.push(setId);
        }
      } else {
        state.workout.completedSets = state.workout.completedSets.filter(id => id !== setId);
      }

      state.workout.finished = false;
      saveState();
      updateProgress();
    });
  });

  updateProgress();
}

function restoreWorkoutProgress() {
  document.querySelectorAll(".set").forEach((button, index) => {
    button.dataset.setId = button.dataset.setId || `set_${index + 1}`;

    if (state.workout.completedSets.includes(button.dataset.setId)) {
      button.classList.add("done");
    } else {
      button.classList.remove("done");
    }
  });

  updateProgress();
}

function updateProgress() {
  const setButtons = document.querySelectorAll(".set");
  const totalSets = setButtons.length;
  const completedSets = document.querySelectorAll(".set.done").length;
  const percentage = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;

  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");
  const heroPercent = document.getElementById("heroPercent");
  const heroRing = document.getElementById("heroRing");

  if (progressText) {
    progressText.textContent = `${completedSets} de ${totalSets} séries concluídas`;
  }

  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }

  if (heroPercent) {
    heroPercent.textContent = `${percentage}%`;
  }

  if (heroRing) {
    heroRing.style.setProperty("--progress", percentage);
  }

  updateHomeWorkoutMetric(completedSets, totalSets);
}

function updateHomeWorkoutMetric(done, total) {
  const percentage = total ? Math.round((done / total) * 100) : 0;

  document.querySelectorAll(".metric").forEach(metric => {
    const label = metric.querySelector(".label");
    const value = metric.querySelector(".value");

    if (!label || !value) return;

    if (normalizeText(label.textContent) === "treinos") {
      value.textContent = percentage >= 100 ? "1/1" : `${done}/${total}`;
    }
  });
}

function saveWorkout() {
  state.workout.saved = true;
  saveState();
  showToast("Registro salvo.");
}

function finishWorkout() {
  const totalSets = document.querySelectorAll(".set").length;
  const completedSets = document.querySelectorAll(".set.done").length;

  if (completedSets < totalSets) {
    showToast("Ainda há séries pendentes.");
    return;
  }

  state.workout.saved = true;
  state.workout.finished = true;
  saveState();

  showToast("Treino finalizado.");

  setTimeout(() => {
    goTo("home");
  }, 900);
}

/* TIMERS */

function bindTimers() {
  document.querySelectorAll(".timer").forEach((timerBox, index) => {
    const display = timerBox.querySelector(".timer-display");
    const startButton = timerBox.querySelector(".start-timer");
    const resetButton = timerBox.querySelector(".reset-timer");

    if (!display || !startButton || !resetButton) return;

    const timerId = `timer_${index + 1}`;
    const initial = Number(display.dataset.time || 0);

    timers[timerId] = {
      initial,
      remaining: initial,
      interval: null,
      running: false,
      display,
      startButton
    };

    display.textContent = formatTime(initial);

    startButton.addEventListener("click", () => {
      toggleTimer(timerId);
    });

    resetButton.addEventListener("click", () => {
      resetTimer(timerId);
    });
  });
}

function toggleTimer(timerId) {
  const timer = timers[timerId];

  if (!timer) return;

  if (!timer.running) {
    timer.running = true;
    timer.startButton.textContent = "Pause";

    timer.interval = setInterval(() => {
      if (timer.remaining > 0) {
        timer.remaining--;
        timer.display.textContent = formatTime(timer.remaining);
      } else {
        clearInterval(timer.interval);
        timer.running = false;
        timer.startButton.textContent = "Start";
        showToast("Timer concluído.");
      }
    }, 1000);

    return;
  }

  clearInterval(timer.interval);
  timer.running = false;
  timer.startButton.textContent = "Start";
}

function resetTimer(timerId) {
  const timer = timers[timerId];

  if (!timer) return;

  clearInterval(timer.interval);
  timer.running = false;
  timer.remaining = timer.initial;
  timer.display.textContent = formatTime(timer.initial);
  timer.startButton.textContent = "Start";
}

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return `${minutes}:${secs}`;
}

/* NUTRITION */

function bindNutrition() {
  const checklistScreen = document.getElementById("nutritionChecklist");

  if (!checklistScreen) return;

  checklistScreen.querySelectorAll(".list-item").forEach((item, index) => {
    item.dataset.nutritionId = item.dataset.nutritionId || `nutrition_${index + 1}`;

    item.addEventListener("click", () => {
      toggleNutritionItem(item);
    });
  });

  restoreNutritionChecklist();
}

function toggleNutritionItem(item) {
  const strong = item.querySelector("strong");
  const span = item.querySelector("span");

  if (!strong || !span) return;

  const isDone = strong.textContent.trim() === "✓";

  strong.textContent = isDone ? "—" : "✓";

  const id = item.dataset.nutritionId;
  state.nutrition.checklist[id] = !isDone;

  saveState();
  updateNutritionMetric();
}

function restoreNutritionChecklist() {
  const checklistScreen = document.getElementById("nutritionChecklist");

  if (!checklistScreen) return;

  checklistScreen.querySelectorAll(".list-item").forEach(item => {
    const strong = item.querySelector("strong");
    const id = item.dataset.nutritionId;

    if (!strong || !id) return;

    if (state.nutrition.checklist[id]) {
      strong.textContent = "✓";
    }
  });

  updateNutritionMetric();
}

function updateNutritionMetric() {
  const values = Object.values(state.nutrition.checklist);
  const total = values.length || 1;
  const done = values.filter(Boolean).length;
  const percentage = Math.round((done / total) * 100);

  document.querySelectorAll(".metric").forEach(metric => {
    const label = metric.querySelector(".label");
    const value = metric.querySelector(".value");

    if (!label || !value) return;

    if (normalizeText(label.textContent) === "proteina") {
      value.textContent = `${percentage}%`;
    }
  });
}

/* SHOP */

function bindShop() {
  document.querySelectorAll(".product").forEach((product, index) => {
    product.dataset.productId = product.dataset.productId || `product_${index + 1}`;

    product.addEventListener("click", () => {
      const title = product.querySelector(".option-title")?.textContent?.trim() || "Produto";
      state.shop.currentProduct = title;
      saveState();

      updateProductScreen(title);
    });
  });

  document.querySelectorAll(".list-item").forEach(item => {
    const text = normalizeText(item.textContent);

    if (text.includes("wishlist")) {
      item.addEventListener("click", () => {
        const product = state.shop.currentProduct || "Oversized";
        toggleWishlist(product);
      });
    }
  });
}

function updateProductScreen(title) {
  const productScreen = document.getElementById("product");

  if (!productScreen) return;

  const titleElement = productScreen.querySelector(".hero h2, h2");

  if (titleElement) {
    titleElement.textContent = title;
  }
}

function toggleWishlist(product) {
  if (state.shop.wishlist.includes(product)) {
    state.shop.wishlist = state.shop.wishlist.filter(item => item !== product);
    showToast("Removido da wishlist.");
  } else {
    state.shop.wishlist.push(product);
    showToast("Adicionado à wishlist.");
  }

  saveState();
}

/* UTIL */

function normalizeText(text) {
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
