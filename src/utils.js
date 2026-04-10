import chalk from 'chalk';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';

/**
 * Format task priority with color
 * @param {string} priority - Priority level
 * @returns {string} Colored priority string
 */
export function formatPriority(priority) {
  const priorityMap = {
    high: chalk.red.bold('HIGH'),
    medium: chalk.yellow.bold('MEDIUM'),
    low: chalk.green.bold('LOW')
  };
  return priorityMap[priority] || priority;
}

/**
 * Format task status with color
 * @param {string} status - Task status
 * @returns {string} Colored status string
 */
export function formatStatus(status) {
  const statusMap = {
    pending: chalk.yellow('⏳ Pending'),
    in_progress: chalk.blue('🔄 In Progress'),
    completed: chalk.green('✅ Completed'),
    cancelled: chalk.gray('❌ Cancelled')
  };
  return statusMap[status] || status;
}

/**
 * Format date for display
 * @param {string|null} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return chalk.gray('No due date');
  
  try {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return chalk.yellow('Today');
    } else if (isTomorrow(date)) {
      return chalk.yellow('Tomorrow');
    } else if (isPast(date)) {
      return chalk.red(format(date, 'MMM dd, yyyy'));
    } else {
      return chalk.green(format(date, 'MMM dd, yyyy'));
    }
  } catch {
    return dateString;
  }
}

/**
 * Display a task in a formatted way
 * @param {Object} task - Task object
 * @param {boolean} detailed - Show detailed information
 */
export function displayTask(task, detailed = false) {
  console.log(chalk.bold.cyan(`\n📋 Task #${task.id.slice(-6)}`));
  console.log(chalk.bold.white(`   ${task.title}`));
  
  if (task.description) {
    console.log(chalk.gray(`   ${task.description}`));
  }
  
  console.log(`   Status: ${formatStatus(task.status)}`);
  console.log(`   Priority: ${formatPriority(task.priority)}`);
  console.log(`   Category: ${chalk.cyan(task.category)}`);
  
  if (task.dueDate) {
    console.log(`   Due Date: ${formatDate(task.dueDate)}`);
  }
  
  if (task.estimatedTime) {
    console.log(`   Estimated Time: ${chalk.blue(task.estimatedTime)} hours`);
  }
  
  if (task.actualTime) {
    const diff = parseFloat(task.actualTime) - parseFloat(task.estimatedTime || 0);
    const timeColor = diff > 0 ? chalk.red : chalk.green;
    console.log(`   Actual Time: ${chalk.blue(task.actualTime)} hours ${timeColor(`(${diff > 0 ? '+' : ''}${diff.toFixed(2)})`)}`);
  }
  
  if (task.tags && task.tags.length > 0) {
    console.log(`   Tags: ${task.tags.map(t => chalk.magenta(`#${t}`)).join(' ')}`);
  }
  
  if (detailed) {
    console.log(chalk.gray(`   Created: ${format(parseISO(task.createdAt), 'MMM dd, yyyy HH:mm')}`));
    if (task.completedAt) {
      console.log(chalk.green(`   Completed: ${format(parseISO(task.completedAt), 'MMM dd, yyyy HH:mm')}`));
    }
  }
  
  console.log('');
}

/**
 * Display multiple tasks in a list format
 * @param {Array} tasks - Array of tasks
 * @param {string} title - List title
 */
export function displayTaskList(tasks, title = 'Tasks') {
  if (tasks.length === 0) {
    console.log(chalk.yellow('\n📭 No tasks found.\n'));
    return;
  }
  
  console.log(chalk.bold.cyan(`\n📋 ${title} (${tasks.length})`));
  console.log(chalk.gray('─'.repeat(60)));
  
  tasks.forEach((task, index) => {
    const statusIcon = task.status === 'completed' ? '✅' : 
                      task.status === 'in_progress' ? '🔄' : '⏳';
    const priorityDot = task.priority === 'high' ? '🔴' : 
                       task.priority === 'medium' ? '🟡' : '🟢';
    
    console.log(`${index + 1}. [${task.id}] ${statusIcon} ${priorityDot} ${chalk.bold(task.title)}`);
    console.log(`   ${formatStatus(task.status)} | ${formatPriority(task.priority)} | ${task.category}`);
    if (task.dueDate) {
      console.log(`   Due: ${formatDate(task.dueDate)}`);
    }
  });
  
  console.log(chalk.gray('─'.repeat(60)) + '\n');
}

/**
 * Calculate task statistics
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Statistics object
 */
export function calculateStats(tasks) {
  const stats = {
    total: tasks.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    high: 0,
    medium: 0,
    low: 0,
    overdue: 0,
    totalEstimatedTime: 0,
    totalActualTime: 0,
    categories: {},
    completionRate: 0
  };
  
  const now = new Date();
  
  tasks.forEach(task => {
    // Status counts
    stats[task.status] = (stats[task.status] || 0) + 1;
    
    // Priority counts
    stats[task.priority] = (stats[task.priority] || 0) + 1;
    
    // Category counts
    stats.categories[task.category] = (stats.categories[task.category] || 0) + 1;
    
    // Time tracking
    if (task.estimatedTime) {
      stats.totalEstimatedTime += parseFloat(task.estimatedTime);
    }
    if (task.actualTime) {
      stats.totalActualTime += parseFloat(task.actualTime);
    }
    
    // Overdue tasks
    if (task.dueDate && task.status !== 'completed') {
      const dueDate = parseISO(task.dueDate);
      if (isPast(dueDate) && !isToday(dueDate)) {
        stats.overdue++;
      }
    }
  });
  
  if (stats.total > 0) {
    stats.completionRate = ((stats.completed / stats.total) * 100).toFixed(1);
  }
  
  return stats;
}

/**
 * Display statistics in a formatted way
 * @param {Object} stats - Statistics object
 */
export function displayStats(stats) {
  console.log(chalk.bold.cyan('\n📊 Task Statistics\n'));
  console.log(chalk.gray('─'.repeat(60)));
  
  console.log(chalk.bold('Overview:'));
  console.log(`   Total Tasks: ${chalk.cyan(stats.total)}`);
  console.log(`   Completion Rate: ${chalk.green(stats.completionRate + '%')}`);
  console.log(`   Overdue: ${stats.overdue > 0 ? chalk.red(stats.overdue) : chalk.green(stats.overdue)}`);
  
  console.log(chalk.bold('\nStatus Breakdown:'));
  console.log(`   ${formatStatus('pending')}: ${chalk.yellow(stats.pending)}`);
  console.log(`   ${formatStatus('in_progress')}: ${chalk.blue(stats.in_progress)}`);
  console.log(`   ${formatStatus('completed')}: ${chalk.green(stats.completed)}`);
  console.log(`   ${formatStatus('cancelled')}: ${chalk.gray(stats.cancelled)}`);
  
  console.log(chalk.bold('\nPriority Breakdown:'));
  console.log(`   ${formatPriority('high')}: ${chalk.red(stats.high)}`);
  console.log(`   ${formatPriority('medium')}: ${chalk.yellow(stats.medium)}`);
  console.log(`   ${formatPriority('low')}: ${chalk.green(stats.low)}`);
  
  if (stats.totalEstimatedTime > 0 || stats.totalActualTime > 0) {
    console.log(chalk.bold('\nTime Tracking:'));
    console.log(`   Estimated: ${chalk.blue(stats.totalEstimatedTime.toFixed(2))} hours`);
    console.log(`   Actual: ${chalk.blue(stats.totalActualTime.toFixed(2))} hours`);
    if (stats.totalActualTime > 0 && stats.totalEstimatedTime > 0) {
      const diff = stats.totalActualTime - stats.totalEstimatedTime;
      const diffColor = diff > 0 ? chalk.red : chalk.green;
      console.log(`   Difference: ${diffColor((diff > 0 ? '+' : '') + diff.toFixed(2))} hours`);
    }
  }
  
  if (Object.keys(stats.categories).length > 0) {
    console.log(chalk.bold('\nCategories:'));
    Object.entries(stats.categories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${chalk.cyan(category)}: ${count}`);
      });
  }
  
  console.log(chalk.gray('─'.repeat(60)) + '\n');
}

/**
 * Validate task data
 * @param {Object} taskData - Task data to validate
 * @returns {Object} Validation result
 */
export function validateTaskData(taskData) {
  const errors = [];
  
  if (!taskData.title || taskData.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (taskData.priority && !['high', 'medium', 'low'].includes(taskData.priority)) {
    errors.push('Priority must be high, medium, or low');
  }
  
  if (taskData.status && !['pending', 'in_progress', 'completed', 'cancelled'].includes(taskData.status)) {
    errors.push('Invalid status');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}