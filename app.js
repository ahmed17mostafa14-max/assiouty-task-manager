/**
 * ==========================================================
 * زياد (Web) & الأسيوطي (iOS & Android App)
 * Core Logic: CRUD, Themes, Confetti, Segmented Pills, Backup, PWA
 * ==========================================================
 */

// Application State
const state = {
  tasks: [],
  storageMode: 'local',
  currentTheme: 'indigo',
  currentFilter: 'all',
  currentSort: 'newest',
  searchQuery: '',
  isOnline: navigator.onLine,
  lastSyncTime: null
};

// Storage Keys
const LOCAL_STORAGE_KEY = 'ziad_assiouty_tasks_v2';
const CLOUD_STORAGE_KEY = 'ziad_assiouty_cloud_sim_v2';
const MODE_STORAGE_KEY = 'ziad_assiouty_mode_pref';
const THEME_STORAGE_KEY = 'ziad_assiouty_theme_pref';

// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskCategorySelect = document.getElementById('taskCategorySelect');
const taskPrioritySelect = document.getElementById('taskPrioritySelect');
const taskDueDateInput = document.getElementById('taskDueDateInput');

const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');

// Stats Elements
const totalTasksCount = document.getElementById('totalTasksCount');
const activeTasksCount = document.getElementById('activeTasksCount');
const completedTasksCount = document.getElementById('completedTasksCount');
const urgentTasksCount = document.getElementById('urgentTasksCount');
const completionRateText = document.getElementById('completionRateText');
const progressBarFill = document.getElementById('progressBarFill');

// Toolbar Elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterTabs = document.querySelectorAll('.filter-tab');
const filterAllCount = document.getElementById('filterAllCount');
const filterActiveCount = document.getElementById('filterActiveCount');
const filterCompletedCount = document.getElementById('filterCompletedCount');
const sortSelect = document.getElementById('sortSelect');

// Mode & Sync
const modeLocalBtn = document.getElementById('modeLocalBtn');
const modeOnlineBtn = document.getElementById('modeOnlineBtn');
const connectionStatus = document.getElementById('connectionStatus');
const connectionText = document.getElementById('connectionText');
const syncStatusText = document.getElementById('syncStatusText');
const syncNowBtn = document.getElementById('syncNowBtn');
const syncBtnText = document.getElementById('syncBtnText');

// Modals
const installAppBtn = document.getElementById('installAppBtn');
const installGuideModal = document.getElementById('installGuideModal');
const closeInstallModal = document.getElementById('closeInstallModal');
const dismissModalBtn = document.getElementById('dismissModalBtn');
const androidInstallTriggerBtn = document.getElementById('androidInstallTriggerBtn');
const iosInstructions = document.getElementById('iosInstructions');
const androidInstructions = document.getElementById('androidInstructions');

const editTaskModal = document.getElementById('editTaskModal');
const editTaskForm = document.getElementById('editTaskForm');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editTaskId = document.getElementById('editTaskId');
const editTaskTitle = document.getElementById('editTaskTitle');
const editTaskCategory = document.getElementById('editTaskCategory');
const editTaskPriority = document.getElementById('editTaskPriority');
const editTaskDueDate = document.getElementById('editTaskDueDate');

// Backup & Actions
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataInput = document.getElementById('importDataInput');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const resetDemoTasksBtn = document.getElementById('resetDemoTasksBtn');
const restoreStarterTasksBtn = document.getElementById('restoreStarterTasksBtn');
const toastContainer = document.getElementById('toastContainer');
const confettiCanvas = document.getElementById('confettiCanvas');

let deferredPrompt = null;

// ==========================================================
// 1. Initializer & Theme Setup
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  // Set default due date to today
  const today = new Date().toISOString().split('T')[0];
  taskDueDateInput.value = today;

  // Load Saved Theme
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'indigo';
  setTheme(savedTheme, false);

  // Load Mode preference
  const savedMode = localStorage.getItem(MODE_STORAGE_KEY) || 'local';
  setStorageMode(savedMode, false);

  // Load Tasks
  loadTasks();

  // Setup Listeners
  initEventListeners();
  initFormPills();
  initThemePicker();

  // PWA & Network
  registerServiceWorker();
  updateNetworkStatus();
});

// Theme Management
function setTheme(theme, showToastMsg = true) {
  state.currentTheme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  // Update meta theme color
  const metaTheme = document.getElementById('metaThemeColor');
  if (metaTheme) {
    if (theme === 'emerald') metaTheme.content = '#10b981';
    else if (theme === 'rose') metaTheme.content = '#f43f5e';
    else metaTheme.content = '#4f46e5';
  }

  // Update theme circles active state
  document.querySelectorAll('.theme-circle').forEach(circle => {
    circle.classList.toggle('active', circle.dataset.theme === theme);
  });

  if (showToastMsg) {
    const themeNames = { indigo: 'النيلي الملكي', emerald: 'الزمردي التكنولوجي', rose: 'الوردي السيبراني' };
    showToast(`تم تفعيل نسق ألوان: ${themeNames[theme] || theme}`, 'info');
  }
}

function initThemePicker() {
  document.querySelectorAll('.theme-circle').forEach(btn => {
    btn.addEventListener('click', () => {
      setTheme(btn.dataset.theme, true);
    });
  });
}

// Interactive Segmented Pills (Category & Priority in Form)
function initFormPills() {
  // Category Pills
  const catPills = document.querySelectorAll('#categoryPills .seg-pill');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      taskCategorySelect.value = pill.dataset.value;
    });
  });

  // Priority Pills
  const priorityPills = document.querySelectorAll('#priorityPills .seg-pill');
  priorityPills.forEach(pill => {
    pill.addEventListener('click', () => {
      priorityPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      taskPrioritySelect.value = pill.dataset.value;
    });
  });
}

// ==========================================================
// 2. Storage & Curated College Starter Tasks
// ==========================================================
function getStarterTasks() {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(now + 86400000).toISOString().split('T')[0];
  const inThreeDays = new Date(now + 3 * 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'task-college-1',
      title: 'تسليم مشروع الـ Task Manager لأخويا وعرض ميزات الـ PWA 🚀',
      category: 'مشاريع',
      priority: 'عاجل',
      dueDate: today,
      completed: false,
      createdAt: now - 1800000
    },
    {
      id: 'task-college-2',
      title: 'مذاكرة مادة هياكل البيانات (Data Structures) وحل مسائل عليها 🎓',
      category: 'دراسة',
      priority: 'عاجل',
      dueDate: tomorrow,
      completed: false,
      createdAt: now - 3600000
    },
    {
      id: 'task-college-3',
      title: 'تثبيت تطبيق الأسيوطي على شاشة الموبايل والتأكد من الأوفلاين 📱',
      category: 'مشاريع',
      priority: 'عاجل',
      dueDate: today,
      completed: true,
      createdAt: now - 7200000
    },
    {
      id: 'task-college-4',
      title: 'مراجعة كود جافاسكريبت والـ LocalStorage لفهم كل سطر برمجياً 💻',
      category: 'دراسة',
      priority: 'متوسط',
      dueDate: tomorrow,
      completed: false,
      createdAt: now - 10800000
    },
    {
      id: 'task-college-5',
      title: 'تجهيز ملخص محاضرات تانية كلية للامتحانات القادمة 📚',
      category: 'دراسة',
      priority: 'متوسط',
      dueDate: inThreeDays,
      completed: false,
      createdAt: now - 14400000
    },
    {
      id: 'task-college-6',
      title: 'تمرين الجيم والاهتمام بالصحة والنشاط اليومي 🏋️',
      category: 'شخصي',
      priority: 'منخفض',
      dueDate: today,
      completed: true,
      createdAt: now - 18000000
    }
  ];
}

function loadTasks() {
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      state.tasks = JSON.parse(localData);
    } else {
      // First time launch: use curated college tasks
      state.tasks = getStarterTasks();
      saveTasks();
    }
  } catch (e) {
    state.tasks = getStarterTasks();
  }
  renderTasks();
}

function saveTasks() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.tasks));

    if (state.storageMode === 'online') {
      if (state.isOnline) {
        localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(state.tasks));
        syncStatusText.textContent = `متزامن الآن (${new Date().toLocaleTimeString('ar-EG')}) ☁️`;
      } else {
        syncStatusText.textContent = 'محفوظ محلياً (في انتظار الاتصال) ⚠️';
      }
    } else {
      syncStatusText.textContent = 'محفوظ محلياً على الجهاز 💾';
    }
  } catch (e) {
    console.error('خطأ في حفظ المهام:', e);
  }

  renderTasks();
}

function setStorageMode(mode, showToastMsg = true) {
  state.storageMode = mode;
  localStorage.setItem(MODE_STORAGE_KEY, mode);

  if (mode === 'local') {
    modeLocalBtn.classList.add('active');
    modeOnlineBtn.classList.remove('active');
    syncStatusText.textContent = 'محفوظ محلياً على الجهاز 💾';
    if (showToastMsg) showToast('الوضع النشط: تخزين محلي (Local Mode)', 'info');
  } else {
    modeOnlineBtn.classList.add('active');
    modeLocalBtn.classList.remove('active');
    syncStatusText.textContent = 'متزامن مع السحابة أونلاين ☁️';
    if (showToastMsg) showToast('الوضع النشط: مزامنة سحابية (Cloud Online Mode)', 'success');
    performCloudSync(false);
  }
}

function performCloudSync(userTriggered = true) {
  if (!state.isOnline) {
    showToast('أنت غير متصل بالإنترنت حالياً! تم الاحتفاظ بالبيانات محلياً.', 'warning');
    return;
  }

  syncNowBtn.classList.add('syncing');
  syncBtnText.textContent = 'جارِ المزامنة...';

  setTimeout(() => {
    localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(state.tasks));
    syncNowBtn.classList.remove('syncing');
    syncBtnText.textContent = 'مزامنة سحابية';
    syncStatusText.textContent = `متزامن سحابياً (${new Date().toLocaleTimeString('ar-EG')}) ☁️`;

    if (userTriggered) {
      playAudioCue('success');
      showToast('تمت مزامنة جميع المهام بنجاح مع السحابة! ☁️', 'success');
    }
    renderTasks();
  }, 600);
}

function resetToCuratedTasks() {
  if (confirm('هل تريد استرجاع قائمة المهام النموذجية لتانية كلية والمشروع؟')) {
    state.tasks = getStarterTasks();
    saveTasks();
    triggerConfetti();
    showToast('تم استرجاع المهام النموذجية بنجاح! 🚀', 'success');
  }
}

// ==========================================================
// 3. Task Management (CRUD)
// ==========================================================
function addTask(title, category, priority, dueDate) {
  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    title: title.trim(),
    category: category,
    priority: priority,
    dueDate: dueDate || '',
    completed: false,
    createdAt: Date.now()
  };

  state.tasks.unshift(newTask);
  saveTasks();
  playAudioCue('add');
  showToast('تمت إضافة المهمة بنجاح!', 'success');
}

function toggleTaskStatus(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();

  if (task.completed) {
    playAudioCue('complete');
    triggerHaptic();
    triggerConfetti();
    showToast('عاش جداً! تم إنجاز المهمة بنجاح 🎉', 'success');
  }
}

function deleteTask(id) {
  const index = state.tasks.findIndex(t => t.id === id);
  if (index === -1) return;

  const deleted = state.tasks.splice(index, 1)[0];
  saveTasks();
  playAudioCue('delete');
  showToast(`تم حذف: "${deleted.title.substring(0, 25)}..."`, 'info');
}

function openEditModal(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  editTaskId.value = task.id;
  editTaskTitle.value = task.title;
  editTaskCategory.value = task.category;
  editTaskPriority.value = task.priority;
  editTaskDueDate.value = task.dueDate || '';

  editTaskModal.classList.add('active');
}

function saveEditedTask(id, title, category, priority, dueDate) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  task.title = title.trim();
  task.category = category;
  task.priority = priority;
  task.dueDate = dueDate;

  saveTasks();
  editTaskModal.classList.remove('active');
  showToast('تم تحديث المهمة بنجاح!', 'success');
}

function clearCompletedTasks() {
  const completedCount = state.tasks.filter(t => t.completed).length;
  if (completedCount === 0) {
    showToast('لا توجد مهام مكتملة لحذفها!', 'info');
    return;
  }

  if (confirm(`هل أنت متأكد من حذف ${completedCount} من المهام المكتملة؟`)) {
    state.tasks = state.tasks.filter(t => !t.completed);
    saveTasks();
    showToast(`تم حذف ${completedCount} مهمة مكتملة.`, 'info');
  }
}

// ==========================================================
// 4. Rendering & Stats
// ==========================================================
function renderTasks() {
  updateStats();

  let filtered = state.tasks.filter(task => {
    if (state.currentFilter === 'active' && task.completed) return false;
    if (state.currentFilter === 'completed' && !task.completed) return false;

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchCategory = task.category.toLowerCase().includes(q);
      if (!matchTitle && !matchCategory) return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (state.currentSort === 'newest') return b.createdAt - a.createdAt;
    if (state.currentSort === 'oldest') return a.createdAt - b.createdAt;
    if (state.currentSort === 'priority') {
      const pWeights = { 'عاجل': 3, 'متوسط': 2, 'منخفض': 1 };
      return (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0);
    }
    if (state.currentSort === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  tasksList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach(task => {
      const taskEl = createTaskElement(task);
      tasksList.appendChild(taskEl);
    });
  }
}

function createTaskElement(task) {
  const item = document.createElement('div');
  item.className = `task-item ${task.completed ? 'completed' : ''}`;
  item.dataset.id = task.id;
  item.dataset.priority = task.priority;

  // Due Date Badge formatting
  let dueDateHtml = '';
  if (task.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    let dateLabel = task.dueDate;
    let dateClass = '';

    if (task.dueDate === today) {
      dateLabel = 'اليوم ⚡';
      dateClass = 'today';
    } else if (task.dueDate === tomorrow) {
      dateLabel = 'غداً 📅';
      dateClass = 'today';
    } else if (task.dueDate < today && !task.completed) {
      dateLabel = 'متأخرة! ⚠️';
      dateClass = 'overdue';
    }

    dueDateHtml = `
      <span class="meta-badge badge-due-date ${dateClass}">
        📅 ${dateLabel}
      </span>
    `;
  }

  // Priority Badge class
  let priorityClass = 'badge-priority-med';
  if (task.priority === 'عاجل') priorityClass = 'badge-priority-urgent';
  if (task.priority === 'منخفض') priorityClass = 'badge-priority-low';

  // Category Badge class
  const catClasses = {
    'دراسة': 'badge-cat-study',
    'مشاريع': 'badge-cat-projects',
    'شغل': 'badge-cat-work',
    'شخصي': 'badge-cat-personal'
  };
  const categoryClass = catClasses[task.category] || 'badge-cat-study';

  item.innerHTML = `
    <div class="task-content-wrapper">
      <label class="custom-checkbox" title="تحديد كمنجز">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="checkmark"></span>
      </label>
      <div class="task-details">
        <span class="task-title">${escapeHtml(task.title)}</span>
        <div class="task-meta-row">
          <span class="meta-badge ${categoryClass}">${escapeHtml(task.category)}</span>
          <span class="meta-badge ${priorityClass}">${task.priority}</span>
          ${dueDateHtml}
        </div>
      </div>
    </div>
    <div class="task-actions">
      <button class="action-btn edit-btn" title="تعديل المهمة">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="action-btn delete-btn" title="حذف المهمة">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    </div>
  `;

  // Attach Item Listeners
  item.querySelector('.task-checkbox').addEventListener('change', () => toggleTaskStatus(task.id));
  item.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));
  item.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

  return item;
}

function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const active = total - completed;
  const urgent = state.tasks.filter(t => t.priority === 'عاجل' && !t.completed).length;

  totalTasksCount.textContent = total;
  activeTasksCount.textContent = active;
  completedTasksCount.textContent = completed;
  urgentTasksCount.textContent = urgent;

  filterAllCount.textContent = total;
  filterActiveCount.textContent = active;
  filterCompletedCount.textContent = completed;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  completionRateText.textContent = `${percentage}% مكتمل`;
  progressBarFill.style.width = `${percentage}%`;
}

// ==========================================================
// 5. Celebration Engine (Confetti Animation)
// ==========================================================
function triggerConfetti() {
  if (!confettiCanvas) return;
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#ffffff'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.4,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10
    });
  }

  let animationId;
  function animate() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.alpha -= 0.015;
      p.rotation += p.vRot;

      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      animationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      cancelAnimationFrame(animationId);
    }
  }

  animate();
}

// ==========================================================
// 6. Network & PWA Install Handlers
// ==========================================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .catch(err => console.warn('[PWA] ServiceWorker info:', err));
    });
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installAppBtn.classList.add('pulse-highlight');
});

function handleAppInstallClick() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        showToast('تم تثبيت تطبيق الأسيوطي بنجاح!', 'success');
      }
      deferredPrompt = null;
    });
  } else {
    installGuideModal.classList.add('active');
    if (isIOS) {
      iosInstructions.style.display = 'block';
      androidInstructions.style.display = 'none';
    } else {
      iosInstructions.style.display = 'block';
      androidInstructions.style.display = 'block';
    }
  }
}

function updateNetworkStatus() {
  state.isOnline = navigator.onLine;
  const indicator = connectionStatus.querySelector('.status-indicator');

  if (state.isOnline) {
    indicator.className = 'status-indicator online';
    connectionText.textContent = 'متصل بالإنترنت 🟢';
    if (state.storageMode === 'online') performCloudSync(false);
  } else {
    indicator.className = 'status-indicator offline';
    connectionText.textContent = 'أوفلاين (محلي) 🔴';
    syncStatusText.textContent = 'يعمل في وضع أوفلاين محلياً 💾';
    showToast('أنت غير متصل بالإنترنت - تطبيق الأسيوطي يعمل محلياً 100%', 'warning');
  }
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// ==========================================================
// 7. Event Listeners Setup
// ==========================================================
function initEventListeners() {
  // Form Submit
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    if (!title) return;

    addTask(
      title,
      taskCategorySelect.value,
      taskPrioritySelect.value,
      taskDueDateInput.value
    );

    taskTitleInput.value = '';
    taskTitleInput.focus();
  });

  // Filter Tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  // Search
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
    renderTasks();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderTasks();
    searchInput.focus();
  });

  // Sort
  sortSelect.addEventListener('change', (e) => {
    state.currentSort = e.target.value;
    renderTasks();
  });

  // Mode Toggles
  modeLocalBtn.addEventListener('click', () => setStorageMode('local'));
  modeOnlineBtn.addEventListener('click', () => setStorageMode('online'));
  syncNowBtn.addEventListener('click', () => performCloudSync(true));

  // Curated Tasks
  resetDemoTasksBtn.addEventListener('click', resetToCuratedTasks);
  if (restoreStarterTasksBtn) {
    restoreStarterTasksBtn.addEventListener('click', resetToCuratedTasks);
  }

  // Install PWA
  installAppBtn.addEventListener('click', handleAppInstallClick);
  closeInstallModal.addEventListener('click', () => installGuideModal.classList.remove('active'));
  dismissModalBtn.addEventListener('click', () => installGuideModal.classList.remove('active'));

  if (androidInstallTriggerBtn) {
    androidInstallTriggerBtn.addEventListener('click', () => {
      installGuideModal.classList.remove('active');
      if (deferredPrompt) deferredPrompt.prompt();
      else showToast('افتح قائمة المتصفح (⋮) واختر "Install App / تثبيت التطبيق"', 'info');
    });
  }

  // Edit Modal
  closeEditModal.addEventListener('click', () => editTaskModal.classList.remove('active'));
  cancelEditBtn.addEventListener('click', () => editTaskModal.classList.remove('active'));

  editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveEditedTask(
      editTaskId.value,
      editTaskTitle.value,
      editTaskCategory.value,
      editTaskPriority.value,
      editTaskDueDate.value
    );
  });

  // Backup Actions
  exportDataBtn.addEventListener('click', exportTasksData);
  importDataInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) importTasksData(e.target.files[0]);
  });
  clearCompletedBtn.addEventListener('click', clearCompletedTasks);
}

// ==========================================================
// 8. Backup Data & Sound
// ==========================================================
function exportTasksData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
  const dl = document.createElement('a');
  const d = new Date().toISOString().split('T')[0];
  dl.setAttribute("href", dataStr);
  dl.setAttribute("download", `assiouty_tasks_${d}.json`);
  document.body.appendChild(dl);
  dl.click();
  dl.remove();
  showToast('تم تصدير نسخة احتياطية من مهامك 💾', 'success');
}

function importTasksData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        state.tasks = imported;
        saveTasks();
        showToast(`تم استيراد ${imported.length} مهمة بنجاح!`, 'success');
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast('خطأ: تأكد من اختيار ملف JSON صحيح.', 'warning');
    }
  };
  reader.readAsText(file);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function playAudioCue(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'add') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'complete') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'delete') {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {}
}

function triggerHaptic() {
  if (navigator.vibrate) navigator.vibrate([15, 30, 20]);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}
