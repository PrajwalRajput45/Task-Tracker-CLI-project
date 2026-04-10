import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../data/tasks.json');

let taskCounter = 0;

function generateShortId() {
  taskCounter++;
  return taskCounter.toString().padStart(4, '0');
}

async function initializeCounter() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const tasks = JSON.parse(data);
    if (tasks.length > 0) {
      const maxId = Math.max(...tasks.map(t => parseInt(t.id) || 0));
      taskCounter = maxId;
    }
  } catch {
    // File doesn't exist or is empty, counter stays at 0
  }
}

function findTaskByShortId(tasks, shortId) {
  return tasks.find(t => t.id.endsWith(shortId)) || null;
}

/**
 * Initialize data directory and file if they don't exist
 */
async function initializeDataFile() {
  await initializeCounter();
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Read all tasks from the data file
 * @returns {Promise<Array>} Array of tasks
 */
export async function getAllTasks() {
  await initializeDataFile();
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

/**
 * Save tasks to the data file
 * @param {Array} tasks - Array of tasks to save
 */
export async function saveTasks(tasks) {
  await initializeDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2));
}

/**
 * Add a new task
 * @param {Object} taskData - Task data object
 * @returns {Promise<Object>} The created task
 */
export async function addTask(taskData) {
  const tasks = await getAllTasks();
  const newTask = {
    id: generateShortId(),
    title: taskData.title,
    description: taskData.description || '',
    priority: taskData.priority || 'medium',
    status: 'pending',
    category: taskData.category || 'general',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: taskData.dueDate || null,
    estimatedTime: taskData.estimatedTime || null,
    actualTime: null,
    tags: taskData.tags || [],
    completedAt: null
  };
  
  tasks.push(newTask);
  await saveTasks(tasks);
  return newTask;
}

/**
 * Update an existing task
 * @param {string} taskId - ID of the task to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated task or null if not found
 */
export async function updateTask(taskId, updates) {
  const tasks = await getAllTasks();
  const task = findTaskByShortId(tasks, taskId);

  if (!task) {
    return null;
  }

  const taskIndex = tasks.findIndex(t => t.id === task.id);
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // If marking as completed, set completedAt
  if (updates.status === 'completed' && !tasks[taskIndex].completedAt) {
    tasks[taskIndex].completedAt = new Date().toISOString();
  }
  
  // If unmarking as completed, clear completedAt
  if (updates.status !== 'completed' && tasks[taskIndex].completedAt) {
    tasks[taskIndex].completedAt = null;
  }
  
  await saveTasks(tasks);
  return tasks[taskIndex];
}

/**
 * Delete a task
 * @param {string} taskId - ID of the task to delete
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function deleteTask(taskId) {
  const tasks = await getAllTasks();
  const task = findTaskByShortId(tasks, taskId);

  if (!task) {
    return false;
  }

  const filteredTasks = tasks.filter(t => t.id !== task.id);
  
  await saveTasks(filteredTasks);
  return true;
}

/**
 * Get a task by ID
 * @param {string} taskId - ID of the task
 * @returns {Promise<Object|null>} Task object or null
 */
export async function getTaskById(taskId) {
  const tasks = await getAllTasks();
  return findTaskByShortId(tasks, taskId);
}

/**
 * Get tasks filtered by status, priority, or category
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} Filtered tasks
 */
export async function getFilteredTasks(filters = {}) {
  const tasks = await getAllTasks();
  
  return tasks.filter(task => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.category && task.category !== filters.category) return false;
    if (filters.tag && !task.tags.includes(filters.tag)) return false;
    return true;
  });
}

/**
 * Start time tracking for a task
 * @param {string} taskId - ID of the task
 * @returns {Promise<Object>} Task with start time
 */
export async function startTimeTracking(taskId) {
  const tasks = await getAllTasks();
  const task = findTaskByShortId(tasks, taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  return await updateTask(task.id, {
    timeTrackingStart: new Date().toISOString()
  });
}

/**
 * Stop time tracking and update actual time
 * @param {string} taskId - ID of the task
 * @returns {Promise<Object>} Task with updated time
 */
export async function stopTimeTracking(taskId) {
  const tasks = await getAllTasks();
  const task = findTaskByShortId(tasks, taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  if (!task.timeTrackingStart) {
    throw new Error('Time tracking not started for this task');
  }
  
  const startTime = new Date(task.timeTrackingStart);
  const endTime = new Date();
  const durationMs = endTime - startTime;
  const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);
  
  const currentActualTime = task.actualTime ? parseFloat(task.actualTime) : 0;
  const newActualTime = (currentActualTime + parseFloat(durationHours)).toFixed(2);
  
  return await updateTask(taskId, {
    actualTime: newActualTime,
    timeTrackingStart: null
  });
}