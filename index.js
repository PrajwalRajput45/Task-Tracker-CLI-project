#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  addTask,
  getAllTasks,
  updateTask,
  deleteTask,
  getTaskById,
  getFilteredTasks,
  startTimeTracking,
  stopTimeTracking
} from './src/taskManager.js ';
import {
  displayTask,
  displayTaskList,
  displayStats,
  calculateStats,
  validateTaskData,
  formatPriority,
  formatStatus
} from './src/utils.js';
import {
  getWeather,
  getMotivationalQuote,
  getWeatherBasedSuggestions,
  getDateTimeInfo
} from './src/apiServices.js';
import {
  getProductivityInsights,
  displayInsights,
  getTaskRecommendations,
  displayRecommendations
} from './src/analytics.js';

const program = new Command();

program
  .name('task')
  .description('Advanced CLI Task Tracker with Web API integration')
  .version('1.0.0');

// Add task command
program
  .command('add')
  .description('Add a new task')
  .option('-t, --title <title>', 'Task title')
  .option('-d, --description <description>', 'Task description')
  .option('-p, --priority <priority>', 'Priority (high/medium/low)', 'medium')
  .option('-c, --category <category>', 'Task category', 'general')
  .option('--due-date <date>', 'Due date (YYYY-MM-DD)')
  .option('--estimated-time <hours>', 'Estimated time in hours')
  .option('--tags <tags>', 'Comma-separated tags')
  .action(async (options) => {
    try {
      let taskData = { ...options };
      
      // If no title provided, prompt interactively
      if (!taskData.title) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Task title:',
            validate: (input) => input.trim().length > 0 || 'Title is required'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Task description (optional):'
          },
          {
            type: 'list',
            name: 'priority',
            message: 'Priority:',
            choices: ['high', 'medium', 'low'],
            default: 'medium'
          },
          {
            type: 'input',
            name: 'category',
            message: 'Category:',
            default: 'general'
          },
          {
            type: 'input',
            name: 'dueDate',
            message: 'Due date (YYYY-MM-DD, optional):',
            validate: (input) => {
              if (!input) return true;
              const date = new Date(input);
              return !isNaN(date.getTime()) || 'Invalid date format';
            }
          },
          {
            type: 'input',
            name: 'estimatedTime',
            message: 'Estimated time in hours (optional):',
            validate: (input) => {
              if (!input) return true;
              const num = parseFloat(input);
              return !isNaN(num) && num > 0 || 'Must be a positive number';
            }
          },
          {
            type: 'input',
            name: 'tags',
            message: 'Tags (comma-separated, optional):'
          }
        ]);
        
        taskData = { ...taskData, ...answers };
        if (taskData.tags) {
          taskData.tags = taskData.tags.split(',').map(t => t.trim()).filter(t => t);
        }
      } else {
        // Parse tags if provided as string
        if (taskData.tags) {
          taskData.tags = taskData.tags.split(',').map(t => t.trim()).filter(t => t);
        }
      }
      
      const validation = validateTaskData(taskData);
      if (!validation.valid) {
        console.error(chalk.red('Validation errors:'));
        validation.errors.forEach(err => console.error(chalk.red(`  - ${err}`)));
        return;
      }
      
      const task = await addTask(taskData);
      console.log(chalk.green('\n✅ Task added successfully!'));
      displayTask(task, true);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

// List tasks command
program
  .command('list')
  .alias('ls')
  .description('List all tasks')
  .option('-s, --status <status>', 'Filter by status')
  .option('-p, --priority <priority>', 'Filter by priority')
  .option('-c, --category <category>', 'Filter by category')
  .option('--tag <tag>', 'Filter by tag')
  .option('--stats', 'Show statistics')
  .action(async (options) => {
    try {
      const filters = {};
      if (options.status) filters.status = options.status;
      if (options.priority) filters.priority = options.priority;
      if (options.category) filters.category = options.category;
      if (options.tag) filters.tag = options.tag;
      
      const tasks = Object.keys(filters).length > 0 
        ? await getFilteredTasks(filters)
        : await getAllTasks();
      
      const title = Object.keys(filters).length > 0 
        ? 'Filtered Tasks' 
        : 'All Tasks';
      
      displayTaskList(tasks, title);
      
      if (options.stats) {
        const stats = calculateStats(tasks);
        displayStats(stats);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

// Show task command
program
  .command('show <taskId>')
  .description('Show detailed information about a task')
  .action(async (taskId) => {
    try {
      const task = await getTaskById(taskId);
      if (!task) {
        console.error(chalk.red(`\n❌ Task with ID ${taskId} not found.\n`));
        return;
      }
      displayTask(task, true);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

// Update task command
program
  .command('update <taskId>')
  .description('Update a task')
  .option('-t, --title <title>', 'New title')
  .option('-d, --description <description>', 'New description')
  .option('-s, --status <status>', 'New status (pending/in_progress/completed/cancelled)')
  .option('-p, --priority <priority>', 'New priority (high/medium/low)')
  .option('-c, --category <category>', 'New category')
  .option('--due-date <date>', 'New due date (YYYY-MM-DD)')
  .action(async (taskId, options) => {
    try {
      const task = await getTaskById(taskId);
      if (!task) {
        console.error(chalk.red(`\n❌ Task with ID ${taskId} not found.\n`));
        return;
      }
      
      const updates = {};
      if (options.title) updates.title = options.title;
      if (options.description !== undefined) updates.description = options.description;
      if (options.status) updates.status = options.status;
      if (options.priority) updates.priority = options.priority;
      if (options.category) updates.category = options.category;
      if (options.dueDate) updates.dueDate = options.dueDate;
      
      if (Object.keys(updates).length === 0) {
        // Interactive update
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'New title (press Enter to keep current):',
            default: task.title
          },
          {
            type: 'input',
            name: 'description',
            message: 'New description (press Enter to keep current):',
            default: task.description
          },
          {
            type: 'list',
            name: 'status',
            message: 'New status:',
            choices: ['pending', 'in_progress', 'completed', 'cancelled'],
            default: task.status
          },
          {
            type: 'list',
            name: 'priority',
            message: 'New priority:',
            choices: ['high', 'medium', 'low'],
            default: task.priority
          },
          {
            type: 'input',
            name: 'category',
            message: 'New category:',
            default: task.category
          }
        ]);
        
        Object.assign(updates, answers);
      }
      
      const updatedTask = await updateTask(taskId, updates);
      console.log(chalk.green('\n✅ Task updated successfully!'));
      displayTask(updatedTask, true);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

// Delete task command
program
  .command('delete <taskId>')
  .alias('rm')
  .description('Delete a task')
  .action(async (taskId) => {
    try {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to delete this task?',
          default: false
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('\n❌ Deletion cancelled.\n'));
        return;
      }
      
      const deleted = await deleteTask(taskId);
      if (deleted) {
        console.log(chalk.green(`\n✅ Task ${taskId} deleted successfully!\n`));
      } else {
        console.error(chalk.red(`\n❌ Task with ID ${taskId} not found.\n`));
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

// Stats command
program
  .command('stats')
  .description('Show task statistics and analytics')
  .action(async () => {
    try {
      const tasks = await getAllTasks();
      const stats = calculateStats(tasks);
      displayStats(stats);
      
      const insights = await getProductivityInsights();
      displayInsights(insights);
      
      const recommendations = await getTaskRecommendations();
      displayRecommendations(recommendations);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

// Weather command
program
  .command('weather [city]')
  .description('Get weather information and task suggestions')
  .action(async (city = 'London') => {
    try {
      console.log(chalk.cyan(`\n🌤️  Fetching weather for ${city}...\n`));
      const result = await getWeatherBasedSuggestions(city);
      
      if (result.success && result.weather) {
        console.log(chalk.bold.cyan('Weather Information:'));
        console.log(`   City: ${chalk.white(result.weather.city)}`);
        console.log(`   Temperature: ${chalk.blue(result.weather.temperature + '°C')}`);
        console.log(`   Condition: ${chalk.cyan(result.weather.condition)}`);
        console.log(`   Humidity: ${chalk.blue(result.weather.humidity + '%')}`);
        console.log(`   Wind Speed: ${chalk.blue(result.weather.windSpeed + ' km/h')}\n`);
        
        if (result.suggestions.length > 0) {
          console.log(chalk.bold.cyan('Weather-Based Task Suggestions:'));
          result.suggestions.forEach((suggestion, index) => {
            console.log(`\n   ${index + 1}. ${chalk.bold(suggestion.title)}`);
            console.log(`      ${chalk.gray(suggestion.description)}`);
            console.log(`      Priority: ${formatPriority(suggestion.priority)}`);
            console.log(`      Category: ${chalk.cyan(suggestion.category)}`);
          });
          console.log('');
        }
      } else {
        console.log(chalk.yellow('⚠️  Could not fetch weather data. Please check your internet connection.\n'));
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

// Motivational quote command
program
  .command('quote')
  .description('Get a motivational quote')
  .action(async () => {
    try {
      console.log(chalk.cyan('\n💬 Fetching motivational quote...\n'));
      const quote = await getMotivationalQuote();
      console.log(chalk.bold.italic(`"${quote.text}"`));
      console.log(chalk.gray(`   — ${quote.author}\n`));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

// Time tracking commands
program
  .command('start <taskId>')
  .description('Start time tracking for a task')
  .action(async (taskId) => {
    try {
      const task = await startTimeTracking(taskId);
      console.log(chalk.green(`\n⏱️  Time tracking started for: ${task.title}\n`));
      displayTask(task);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

program
  .command('stop <taskId>')
  .description('Stop time tracking for a task')
  .action(async (taskId) => {
    try {
      const task = await stopTimeTracking(taskId);
      console.log(chalk.green(`\n⏱️  Time tracking stopped for: ${task.title}`));
      console.log(chalk.blue(`   Total time: ${task.actualTime} hours\n`));
      displayTask(task);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

// Dashboard command
program
  .command('dashboard')
  .alias('dash')
  .description('Show comprehensive dashboard with weather, quote, and tasks')
  .action(async () => {
    try {
      // Date/Time info
      const dateTime = getDateTimeInfo();
      console.log(chalk.bold.cyan('\n📊 Task Tracker Dashboard\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.bold(`Date: ${dateTime.date} | Time: ${dateTime.time}`));
      console.log(chalk.gray(`Day: ${dateTime.dayOfWeek}`));
      console.log(chalk.gray('─'.repeat(60)));
      
      // Motivational quote
      console.log(chalk.cyan('\n💬 Daily Motivation:\n'));
      const quote = await getMotivationalQuote();
      console.log(chalk.italic(`"${quote.text}"`));
      console.log(chalk.gray(`   — ${quote.author}\n`));
      
      // Weather (with error handling)
      try {
        console.log(chalk.cyan('🌤️  Weather:\n'));
        const weather = await getWeather('London');
        console.log(`   ${weather.condition} | ${weather.temperature}°C | ${weather.humidity}% humidity\n`);
      } catch (error) {
        console.log(chalk.yellow('   Weather unavailable\n'));
      }
      
      // Task summary
      const tasks = await getAllTasks();
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
      const completedToday = tasks.filter(t => {
        if (t.status !== 'completed' || !t.completedAt) return false;
        const completed = new Date(t.completedAt);
        const today = new Date();
        return completed.toDateString() === today.toDateString();
      });
      
      console.log(chalk.bold.cyan('📋 Task Summary:\n'));
      console.log(`   ${formatStatus('pending')}: ${chalk.yellow(pendingTasks.length)}`);
      console.log(`   ${formatStatus('in_progress')}: ${chalk.blue(inProgressTasks.length)}`);
      console.log(`   Completed Today: ${chalk.green(completedToday.length)}`);
      console.log(`   Total Tasks: ${chalk.cyan(tasks.length)}\n`);
      
      // Show top 5 pending tasks
      if (pendingTasks.length > 0) {
        const topPending = pendingTasks
          .sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          })
          .slice(0, 5);
        
        console.log(chalk.bold.cyan('🎯 Top Priority Tasks:\n'));
        topPending.forEach((task, index) => {
          console.log(`   ${index + 1}. ${formatPriority(task.priority)} ${chalk.bold(task.title)}`);
        });
        console.log('');
      }
      
      // Insights
      const insights = await getProductivityInsights();
      console.log(chalk.bold.cyan('💡 Quick Insights:\n'));
      console.log(`   Efficiency Score: ${chalk.cyan(insights.efficiencyScore + '/100')}`);
      console.log(`   Completion Rate: ${chalk.cyan(insights.completionRate + '%')}`);
      if (insights.mostProductiveCategory) {
        console.log(`   Most Productive: ${chalk.cyan(insights.mostProductiveCategory)}`);
      }
      console.log('');
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}