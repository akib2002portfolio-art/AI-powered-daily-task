import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'todo-list-items'

function getNextSuggestion(text) {
  const lowerText = text.toLowerCase()

  if (lowerText.includes('study') || lowerText.includes('learn') || lowerText.includes('read')) {
    return {
      title: 'Take a break after 40 minutes',
      detail: 'A short break will help you stay focused and avoid fatigue.',
      time: '10:40',
    }
  }

  if (lowerText.includes('gym') || lowerText.includes('workout') || lowerText.includes('run')) {
    return {
      title: 'Add a cool-down stretch',
      detail: 'A quick cooldown helps your body recover and keeps the routine sustainable.',
      time: '19:30',
    }
  }

  if (lowerText.includes('shop') || lowerText.includes('buy') || lowerText.includes('grocery')) {
    return {
      title: 'Pack your bag before leaving',
      detail: 'A quick prep step makes the errand easier and faster.',
      time: '18:00',
    }
  }

  if (lowerText.includes('code') || lowerText.includes('project') || lowerText.includes('work')) {
    return {
      title: 'Plan the next small step',
      detail: 'Break the task into one tiny action so momentum stays high.',
      time: '16:30',
    }
  }

  return {
    title: 'Add a short reset break',
    detail: 'A 10-minute pause can help you recharge before the next task.',
    time: '15:00',
  }
}

function normalizeTask(task) {
  return {
    id: task.id ?? Date.now(),
    text: task.text ?? '',
    completed: Boolean(task.completed),
    time: task.time ?? '',
    suggestion: task.suggestion ?? '',
  }
}

function QueueDisplay() {
  const [tasks, setTasks] = useState(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved).map(normalizeTask) : []
    } catch {
      return []
    }
  })

  const [draft, setDraft] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [filter, setFilter] = useState('all')
  const [feedback, setFeedback] = useState('')
  const [suggestion, setSuggestion] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    }
  }, [tasks])

  useEffect(() => {
    if (!feedback) return undefined

    const timer = window.setTimeout(() => setFeedback(''), 1500)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const visibleTasks = useMemo(() => {
    if (filter === 'active') {
      return tasks.filter((task) => !task.completed)
    }

    if (filter === 'completed') {
      return tasks.filter((task) => task.completed)
    }

    return tasks
  }, [filter, tasks])

  const addTask = (event) => {
    event.preventDefault()

    const text = draft.trim()
    if (!text) return

    const newTask = {
      id: Date.now(),
      text,
      completed: false,
      time: taskTime,
      suggestion: '',
    }

    setTasks((currentTasks) => [newTask, ...currentTasks])
    setDraft('')
    setTaskTime('')
    setSuggestion(getNextSuggestion(text))
    setFeedback('Task added. AI suggestion is ready.')
  }

  const toggleTask = (id) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
    setFeedback('Task updated')
  }

  const removeTask = (id) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id))
    setFeedback('Task removed')
  }

  const saveTasks = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    }
    setFeedback('Saved locally')
  }

  const clearCompleted = () => {
    setTasks((currentTasks) => currentTasks.filter((task) => !task.completed))
    setFeedback('Completed tasks cleared')
  }

  const addSuggestedTask = () => {
    if (!suggestion) return

    const nextTask = {
      id: Date.now() + 1,
      text: suggestion.title,
      completed: false,
      time: suggestion.time,
      suggestion: suggestion.detail,
    }

    setTasks((currentTasks) => [nextTask, ...currentTasks])
    setSuggestion(null)
    setFeedback('Suggested task added to your plan')
  }

  const dismissSuggestion = () => {
    setSuggestion(null)
    setFeedback('Suggestion dismissed')
  }

  const completedCount = tasks.filter((task) => task.completed).length

  return (
    <main className="todo-app">
      <section className="todo-card">
        <div className="todo-header">
          <div>
            <p className="eyebrow">AI-powered daily task</p>
            <h1>Plan your day</h1>
          </div>
          <div className="todo-stats">
            <span>{tasks.length} tasks</span>
            <span>{completedCount} done</span>
          </div>
        </div>

        <form className="todo-form" onSubmit={addTask}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a new task"
            aria-label="New task"
          />
          <input
            type="time"
            value={taskTime}
            onChange={(event) => setTaskTime(event.target.value)}
            aria-label="Task time"
          />
          <button type="submit">Add</button>
        </form>

        <div className="todo-toolbar">
          <div className="filter-group" role="tablist" aria-label="Task filters">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              All
            </button>
            <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>
              Active
            </button>
            <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>
              Completed
            </button>
          </div>

          <button className="secondary-btn" onClick={saveTasks} type="button">
            Save
          </button>
        </div>

        {feedback ? <p className="feedback">{feedback}</p> : null}

        {suggestion ? (
          <div className="ai-card">
            <div>
              <p className="ai-label">AI suggestion</p>
              <h3>{suggestion.title}</h3>
              <p>{suggestion.detail}</p>
            </div>
            <div className="ai-actions">
              <button className="primary-btn" type="button" onClick={addSuggestedTask}>
                Add to plan
              </button>
              <button className="secondary-btn" type="button" onClick={dismissSuggestion}>
                Skip
              </button>
            </div>
          </div>
        ) : null}

        <ul className="todo-list">
          {visibleTasks.length === 0 ? (
            <li className="empty-state">No tasks here yet. Add one above.</li>
          ) : (
            visibleTasks.map((task) => (
              <li key={task.id} className={`todo-item ${task.completed ? 'done' : ''}`}>
                <div className="task-main">
                  <label className="task-label">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span>{task.text}</span>
                  </label>
                  <div className="task-meta">
                    {task.time ? <span className="task-time">⏰ {task.time}</span> : null}
                    {task.suggestion ? <span className="task-suggestion">{task.suggestion}</span> : null}
                  </div>
                </div>
                <button className="remove-btn" onClick={() => removeTask(task.id)} type="button">
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="todo-footer">
          <p>{completedCount} completed</p>
          <button className="secondary-btn" onClick={clearCompleted} type="button">
            Clear completed
          </button>
        </div>
      </section>
    </main>
  )
}

export default QueueDisplay

