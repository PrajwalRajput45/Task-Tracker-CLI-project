import { calculateStats } from './utils.js';
import { getAllTasks } from './taskManager.js ';
import { parseISO, differenceInDays, differenceInHours } from 'date-fns';
import chalk from 'chalk';

/**
 * Get productivity insights
 * @returns {Promise<Object>} Productivity insights
 */
export async function getProductivityInsights() {
  const tasks = await getAllTasks();
  const stats = calculateStats(tasks);
  
  const insights = {
    completionRate: parseFloat(stats.completionRate),
    averageCompletionTime: null,
    mostProductiveCategory: null,
    tasksCompletedToday: 0,
    tasksCompletedThisWeek: 0,
    efficiencyScore: 0
  };
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Calculate average completion time
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt && t.createdAt);
  if (completedTasks.length > 0) {
    const totalDays = completedTasks.reduce((sum, task) => {
      const created = parseISO(task.createdAt);
      const completed = parseISO(task.completedAt);
      return sum + differenceInDays(completed, created);
    }, 0);
    insights.averageCompletionTime = (totalDays / completedTasks.length).toFixed(1);
  }
  
  // Find most productive category
  const categoryCompletions = {};
  completedTasks.forEach(task => {
    categoryCompletions[task.category] = (categoryCompletions[task.category] || 0) + 1;
  });
  
  if (Object.keys(categoryCompletions).length > 0) {
    insights.mostProductiveCategory = Object.entries(categoryCompletions)
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  // Tasks completed today
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  insights.tasksCompletedToday = completedTasks.filter(task => {
    const completed = parseISO(task.completedAt);
    return completed >= today;
  }).length;
  
  // Tasks completed this week
  insights.tasksCompletedThisWeek = completedTasks.filter(task => {
    const completed = parseISO(task.completedAt);
    return completed >= weekAgo;
  }).length;
  
  // Calculate efficiency score (0-100)
  let efficiencyScore = 0;
  if (stats.total > 0) {
    efficiencyScore += (stats.completed / stats.total) * 40; // Completion rate (40 points)
  }
  if (stats.overdue === 0 && stats.total > 0) {
    efficiencyScore += 30; // No overdue tasks (30 points)
  }
  if (stats.totalActualTime > 0 && stats.totalEstimatedTime > 0) {
    const timeAccuracy = Math.max(0, 1 - Math.abs(stats.totalActualTime - stats.totalEstimatedTime) / stats.totalEstimatedTime);
    efficiencyScore += timeAccuracy * 30; // Time estimation accuracy (30 points)
  }
  
  insights.efficiencyScore = Math.min(100, Math.round(efficiencyScore));
  
  return insights;
}

/**
 * Display productivity insights
 * @param {Object} insights - Insights object
 */
export function displayInsights(insights) {
  console.log(chalk.bold.cyan('\n💡 Productivity Insights\n'));
  console.log(chalk.gray('─'.repeat(60)));
  
  console.log(chalk.bold('Efficiency Score:'));
  const scoreColor = insights.efficiencyScore >= 70 ? chalk.green :
                     insights.efficiencyScore >= 50 ? chalk.yellow : chalk.red;
  console.log(`   ${scoreColor(insights.efficiencyScore + '/100')}`);
  
  console.log(chalk.bold('\nCompletion Metrics:'));
  console.log(`   Completion Rate: ${chalk.cyan(insights.completionRate + '%')}`);
  console.log(`   Completed Today: ${chalk.green(insights.tasksCompletedToday)}`);
  console.log(`   Completed This Week: ${chalk.green(insights.tasksCompletedThisWeek)}`);
  
  if (insights.averageCompletionTime) {
    console.log(`   Average Completion Time: ${chalk.blue(insights.averageCompletionTime + ' days')}`);
  }
  
  if (insights.mostProductiveCategory) {
    console.log(chalk.bold('\nMost Productive Category:'));
    console.log(`   ${chalk.cyan(insights.mostProductiveCategory)}`);
  }
  
  console.log(chalk.gray('─'.repeat(60)) + '\n');
}

/**
 * Get task recommendations based on current state
 * @returns {Promise<Array>} Array of recommendations
 */
export async function getTaskRecommendations() {
  const tasks = await getAllTasks();
  const recommendations = [];
  
  // Check for overdue tasks
  const now = new Date();
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'completed') return false;
    const dueDate = parseISO(task.dueDate);
    return dueDate < now;
  });
  
  if (overdueTasks.length > 0) {
    recommendations.push({
      type: 'warning',
      message: `You have ${overdueTasks.length} overdue task(s). Consider updating their status or due dates.`,
      priority: 'high'
    });
  }
  
  // Check for high priority pending tasks
  const highPriorityPending = tasks.filter(t => 
    t.priority === 'high' && t.status === 'pending'
  );
  
  if (highPriorityPending.length > 0) {
    recommendations.push({
      type: 'info',
      message: `You have ${highPriorityPending.length} high priority task(s) pending.`,
      priority: 'high'
    });
  }
  
  // Check for tasks without time estimates
  const tasksWithoutEstimate = tasks.filter(t => 
    t.status !== 'completed' && !t.estimatedTime
  );
  
  if (tasksWithoutEstimate.length > 0) {
    recommendations.push({
      type: 'suggestion',
      message: `Consider adding time estimates to ${tasksWithoutEstimate.length} task(s) for better planning.`,
      priority: 'medium'
    });
  }
  
  // Check completion rate
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const completionRate = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  
  if (completionRate < 30 && tasks.length > 5) {
    recommendations.push({
      type: 'motivation',
      message: 'Your completion rate is low. Try breaking down large tasks into smaller ones.',
      priority: 'medium'
    });
  }
  
  return recommendations;
}

/**
 * Display recommendations
 * @param {Array} recommendations - Array of recommendations
 */
export function displayRecommendations(recommendations) {
  if (recommendations.length === 0) {
    console.log(chalk.green('\n✨ Great job! No recommendations at this time.\n'));
    return;
  }
  
  console.log(chalk.bold.cyan('\n💬 Recommendations\n'));
  console.log(chalk.gray('─'.repeat(60)));
  
  recommendations.forEach((rec, index) => {
    const icon = rec.type === 'warning' ? '⚠️' :
                 rec.type === 'info' ? 'ℹ️' :
                 rec.type === 'suggestion' ? '💡' : '💪';
    
    const color = rec.priority === 'high' ? chalk.red :
                  rec.priority === 'medium' ? chalk.yellow : chalk.blue;
    
    console.log(`${index + 1}. ${icon} ${color(rec.message)}`);
  });
  
  console.log(chalk.gray('─'.repeat(60)) + '\n');
}