 Task Tracker CLI

An advanced, feature-rich CLI-based Task Tracker that goes beyond traditional todo apps. Built with modern JavaScript concepts including Functions, Async/Await, and Web API integrations.

📌 Features
🎯 Core Features
✅ Create, Read, Update, Delete tasks (CRUD)
🔥 Smart priority system (High, Medium, Low)
⏱ Time tracking (Estimated vs Actual)
🏷 Categories & Tags
📅 Due date tracking
📊 Task status management
🌐 API Integrations
🌦 Weather-based task suggestions
💡 Motivational quotes
🤖 Smart recommendations
📊 Analytics
📈 Productivity insights
📉 Time analysis
📊 Task statistics dashboard
🎨 User Experience
🎨 Colorful CLI output
💬 Interactive prompts
📋 Clean dashboard view
⚙️ Installation
# Clone repo
git clone <your-repo-link>

# Install dependencies
npm install

# Make CLI global (optional)
npm link

🚀 Usage
➕ Add Task
npm start add
npm start add -t "Complete project" -p high -c work

📋 List Tasks
npm start list
npm start list --status pending --priority high

✏️ Update Task
npm start update <taskId>

❌ Delete Task
npm start delete <taskId>

📊 Stats
npm start stats
🌦 Weather
npm start weather
npm start weather "New York"

⏱ Time Tracking
npm start start <taskId>
npm start stop <taskId>

📊 Dashboard
npm start dashboard

📖 Command Reference

Command	Description
add	Add new task
list	List tasks
update	Update task
delete	Delete task
stats	View analytics
weather	Weather suggestions
quote	Get motivation
start	Start timer
stop	Stop timer
dashboard	View dashboard

🧾 Task Properties
Title (required)
Description
Priority → high, medium, low
Status → pending, in_progress, completed
Category
Due Date
Estimated Time
Actual Time
Tags


📁 Project Structure
.
├── index.js
├── package.json
├── src/
│   ├── taskManager.js
│   ├── apiService.js
│   ├── utils.js
│   ├── analytics.js
└── data/
    └── tasks.json

🛠 Tech Stack
Node.js
Commander.js
Inquirer.js
Chalk
Axios
date-fns

All Commands 
● 1. node index.js help                                                                
     - Show all commands                 
                                                                                       
  2. node index.js add
     - Interactive task creation                                                       
                                                            
  3. node index.js add -t "Task title"
     - Add task with title only

  4. node index.js add -t "Title" -d "Description" -p high -c work --due-date
  2026-04-20 --estimated-time 3 --tags "work,urgent"
     - Add task with all options

  5. node index.js list
     - List all tasks (shows short ID in brackets)

  6. node index.js list --stats
     - List tasks with statistics

  7. node index.js list -s pending
     - Filter by status (pending/in_progress/completed/cancelled)

  8. node index.js list -p high
     - Filter by priority (high/medium/low)

  9. node index.js list -c work
     - Filter by category

  10. node index.js list --tag shopping
      - Filter by tag

  11. node index.js show <shortId>
      - Show detailed info for a task (e.g., node index.js show 1)

  12. node index.js update <shortId>
      - Interactive update (prompts for all fields)

  13. node index.js update <shortId> -t "New title"
      - Update title only

  14. node index.js update <shortId> -s completed
      - Mark task as completed

  15. node index.js update <shortId> -p high -s in_progress
      - Update multiple fields at once

  16. node index.js delete <shortId>
      - Delete a task (asks confirmation)

  17. node index.js rm <shortId>
      - Alias for delete

  18. node index.js stats
      - Show statistics and analytics

  19. node index.js weather
      - Get weather info (default: London)

  20. node index.js weather "Tokyo"
      - Get weather for a specific city

  21. node index.js quote
      - Get a motivational quote

  22. node index.js start <shortId>
      - Start time tracking for a task

  23. node index.js stop <shortId>
      - Stop time tracking and record time

  24. node index.js dashboard
      - Show full dashboard with weather, stats, and tasks

  25. node index.js dash
      - Short alias for dashboard

🎯 Why This Project?

✔ Demonstrates real-world CLI development
✔ Shows async/await + API integration
✔ Covers file handling + modular design
✔ Strong portfolio project for placements

📄 License

MIT

🤝 Contributing

Feel free to fork this repo and improve it!
