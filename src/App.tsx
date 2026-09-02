import { useEffect, useMemo, useState } from 'react'
import EmployeeManager from './components/EmployeeManager'
import Icon from './components/Icon'
import ScheduleCalendar from './components/ScheduleCalendar'
import DayEditorModal from './components/DayEditorModal'
import TemplateEditor from './components/TemplateEditor'
import SavedTemplatesBar from './components/SavedTemplatesBar'
import ConfirmModal from './components/ConfirmModal'
import TextInputModal from './components/TextInputModal'
import {
  cloneWeeklyTemplate,
  cloneMonthOverrides,
  createId,
  dateKey,
  formatMonthYear,
  getDaySchedule,
  MONTHS,
  WEEKDAYS,
} from './dateUtils'
import { loadState, saveState } from './storage'
import type { DaySchedule, Employee, ScheduleEntry, SchedulerState, ScheduleTemplate, Weekday } from './types'

interface ConfirmAction {
  eyebrow?: string
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  icon?: 'calendar' | 'refresh' | 'settings' | 'trash' | 'users'
  onConfirm: () => void
}

function App() {
  const [state, setState] = useState<SchedulerState>(() => loadState())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [toast, setToast] = useState('')
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [templateNameModalOpen, setTemplateNameModalOpen] = useState(false)

  useEffect(() => saveState(state), [state])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const overrideCount = Object.keys(state.currentMonthOverrides).length
  const selectedDay = selectedDate
    ? getDaySchedule(selectedDate, state.weeklyTemplate, state.currentMonthOverrides)
    : null

  const totalTemplateEntries = useMemo(
    () => WEEKDAYS.reduce((total, day) => total + state.weeklyTemplate[day.value].entries.length, 0),
    [state.weeklyTemplate],
  )

  function updateState(updater: (current: SchedulerState) => SchedulerState) {
    setState((current) => updater(current))
  }

  function showToast(message: string) {
    setToast(message)
  }

  function addEmployee(name: string): boolean {
    const cleanName = name.trim()
    if (!cleanName || state.employees.some((employee) => employee.name.toLowerCase() === cleanName.toLowerCase())) return false
    updateState((current) => ({
      ...current,
      employees: [...current.employees, { id: `employee-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: cleanName }],
    }))
    showToast(`${cleanName} added to the team`)
    return true
  }

  function renameEmployee(id: string, name: string): boolean {
    const cleanName = name.trim()
    if (!cleanName || state.employees.some((employee) => employee.id !== id && employee.name.toLowerCase() === cleanName.toLowerCase())) return false
    updateState((current) => ({
      ...current,
      employees: current.employees.map((employee) => employee.id === id ? { ...employee, name: cleanName } : employee),
    }))
    showToast('Team member updated')
    return true
  }

  function deleteEmployee(id: string) {
    const employee = state.employees.find((item) => item.id === id)
    if (!employee) return
    setConfirmAction({
      eyebrow: 'Team member',
      title: `Remove ${employee.name}?`,
      message: 'Their rows will also be removed from the current recurring pattern and date-specific changes.',
      confirmLabel: 'Remove employee',
      danger: true,
      icon: 'users',
      onConfirm: () => removeEmployee(id),
    })
  }

  function removeEmployee(id: string) {
    const employee = state.employees.find((item) => item.id === id)
    if (!employee) return
    function removeFromDay(day: DaySchedule): DaySchedule {
      return { ...day, entries: day.entries.filter((entry) => entry.employeeId !== id) }
    }

    updateState((current) => {
      const weeklyTemplate = { ...current.weeklyTemplate }
      for (let day = 0; day < 7; day += 1) weeklyTemplate[day as Weekday] = removeFromDay(weeklyTemplate[day as Weekday])
      const currentMonthOverrides = Object.fromEntries(
        Object.entries(current.currentMonthOverrides).map(([key, day]) => [key, removeFromDay(day)]),
      )
      return {
        ...current,
        employees: current.employees.filter((item) => item.id !== id),
        weeklyTemplate,
        currentMonthOverrides,
      }
    })
    showToast(`${employee.name} removed`)
  }

  function moveEmployee(id: string, direction: -1 | 1) {
    updateState((current) => {
      const index = current.employees.findIndex((employee) => employee.id === id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.employees.length) return current
      const employees = [...current.employees]
      const [moved] = employees.splice(index, 1)
      employees.splice(nextIndex, 0, moved)
      return { ...current, employees }
    })
  }

  function updateTemplateDay(day: Weekday, value: DaySchedule) {
    updateState((current) => ({
      ...current,
      weeklyTemplate: { ...current.weeklyTemplate, [day]: value },
    }))
  }

  function updateTemplateDays(updates: Partial<Record<Weekday, DaySchedule>>) {
    updateState((current) => ({
      ...current,
      weeklyTemplate: { ...current.weeklyTemplate, ...updates },
    }))
    showToast('Recurring schedule created — it now appears in every month')
  }

  function openTemplateNameModal() {
    if (state.employees.length === 0) {
      showToast('Add at least one employee before saving a template')
      return
    }
    setTemplateNameModalOpen(true)
  }

  function saveCurrentAsTemplate(requestedName: string): string | null {
    const name = requestedName.trim()
    if (!name) return 'Enter a name for this template.'
    if (state.templates.some((template) => template.name.toLowerCase() === name.toLowerCase())) {
      return 'A template with that name already exists.'
    }
    const template: ScheduleTemplate = {
      id: createId('template'),
      name,
      builtIn: false,
      employees: state.employees.map((employee) => ({ ...employee })),
      weeklyTemplate: cloneWeeklyTemplate(state.weeklyTemplate),
      monthOverrides: {},
    }
    updateState((current) => ({
      ...current,
      templates: [...current.templates, template],
      activeTemplateId: template.id,
    }))
    showToast(`Template “${name}” saved in this browser`)
    return null
  }

  function updateActiveTemplate() {
    const activeTemplate = state.templates.find((template) => template.id === state.activeTemplateId)
    if (!activeTemplate || activeTemplate.builtIn) return
    updateState((current) => ({
      ...current,
      templates: current.templates.map((template) => template.id === activeTemplate.id ? {
        ...template,
        employees: current.employees.map((employee) => ({ ...employee })),
        weeklyTemplate: cloneWeeklyTemplate(current.weeklyTemplate),
      } : template),
    }))
    showToast(`Template “${activeTemplate.name}” updated`)
  }

  function loadTemplate(templateId: string | null) {
    if (!templateId) {
      updateState((current) => ({ ...current, activeTemplateId: null }))
      return
    }
    const template = state.templates.find((item) => item.id === templateId)
    if (!template || template.id === state.activeTemplateId) return
    setConfirmAction({
      eyebrow: 'Load saved template',
      title: `Load ${template.name}?`,
      message: `Are you sure you want to discard current month changes and load “${template.name}” instead?`,
      confirmLabel: 'Load template',
      icon: 'calendar',
      onConfirm: () => applyTemplate(template.id),
    })
  }

  function applyTemplate(templateId: string) {
    const template = state.templates.find((item) => item.id === templateId)
    if (!template) return
    const monthPrefix = `${state.selectedYear}-${String(state.selectedMonth + 1).padStart(2, '0')}-`
    const monthOverrides = cloneMonthOverrides(Object.fromEntries(
      Object.entries(template.monthOverrides).filter(([key]) => key.startsWith(monthPrefix)),
    ))
    updateState((current) => ({
      ...current,
      employees: template.employees.map((employee) => ({ ...employee })),
      weeklyTemplate: cloneWeeklyTemplate(template.weeklyTemplate),
      activeTemplateId: template.id,
      currentMonthOverrides: monthOverrides,
    }))
    setSelectedDate(null)
    showToast(`Template “${template.name}” loaded`)
  }

  function deleteActiveTemplate() {
    const activeTemplate = state.templates.find((template) => template.id === state.activeTemplateId)
    if (!activeTemplate || activeTemplate.builtIn) return
    setConfirmAction({
      eyebrow: 'Saved template',
      title: `Delete ${activeTemplate.name}?`,
      message: 'This saved template will be removed from this browser. Your current schedule will stay as it is.',
      confirmLabel: 'Delete template',
      danger: true,
      icon: 'trash',
      onConfirm: () => removeActiveTemplate(activeTemplate.id),
    })
  }

  function removeActiveTemplate(templateId: string) {
    updateState((current) => ({
      ...current,
      templates: current.templates.filter((template) => template.id !== templateId),
      activeTemplateId: null,
    }))
    showToast('Saved template deleted')
  }

  function hasPendingOverrides() {
    return Object.keys(state.currentMonthOverrides).length > 0
  }

  function getTemplateOverridesForMonth(year: number, month: number): Record<string, DaySchedule> {
    const activeTemplate = state.templates.find((template) => template.id === state.activeTemplateId)
    if (!activeTemplate) return {}
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
    return cloneMonthOverrides(Object.fromEntries(
      Object.entries(activeTemplate.monthOverrides).filter(([key]) => key.startsWith(monthPrefix)),
    ))
  }

  function changeMonth(year: number, month: number, message = 'Change month? Date-specific edits for the current month will be cleared.') {
    if (year === state.selectedYear && month === state.selectedMonth) return
    if (hasPendingOverrides()) {
      setConfirmAction({
        eyebrow: 'Change month',
        title: 'Change the schedule month?',
        message,
        confirmLabel: 'Change month',
        icon: 'calendar',
        onConfirm: () => applyMonthChange(year, month),
      })
      return
    }
    applyMonthChange(year, month)
  }

  function applyMonthChange(year: number, month: number) {
    updateState((current) => ({ ...current, selectedYear: year, selectedMonth: month, currentMonthOverrides: getTemplateOverridesForMonth(year, month) }))
    setSelectedDate(null)
  }

  function previousMonth() {
    const date = new Date(state.selectedYear, state.selectedMonth - 1, 1)
    changeMonth(date.getFullYear(), date.getMonth())
  }

  function nextMonth() {
    const date = new Date(state.selectedYear, state.selectedMonth + 1, 1)
    changeMonth(date.getFullYear(), date.getMonth())
  }

  function goToCurrentMonth() {
    const today = new Date()
    changeMonth(today.getFullYear(), today.getMonth())
  }

  function regenerateMonth() {
    if (!hasPendingOverrides()) {
      showToast('The calendar is already following the weekly pattern')
      return
    }
    setConfirmAction({
      eyebrow: 'Regenerate month',
      title: 'Regenerate this month?',
      message: 'All date-specific edits will be cleared and the calendar will follow the weekly pattern again.',
      confirmLabel: 'Regenerate month',
      icon: 'refresh',
      onConfirm: regenerateCurrentMonth,
    })
  }

  function regenerateCurrentMonth() {
    updateState((current) => ({ ...current, currentMonthOverrides: {} }))
    setSelectedDate(null)
    showToast(`${formatMonthYear(state.selectedYear, state.selectedMonth)} regenerated`)
  }

  function saveDateOverride(day: DaySchedule) {
    if (!selectedDate) return
    updateState((current) => ({
      ...current,
      currentMonthOverrides: { ...current.currentMonthOverrides, [dateKey(selectedDate)]: day },
    }))
    setSelectedDate(null)
    showToast('Date-specific change saved')
  }

  function resetDateOverride() {
    if (!selectedDate) return
    const key = dateKey(selectedDate)
    updateState((current) => {
      const currentMonthOverrides = { ...current.currentMonthOverrides }
      delete currentMonthOverrides[key]
      return { ...current, currentMonthOverrides }
    })
    setSelectedDate(null)
    showToast('Date reset to the weekly pattern')
  }

  function acceptConfirmAction() {
    const action = confirmAction
    setConfirmAction(null)
    action?.onConfirm()
  }

  return (
    <div className="app-shell">
      <header className="app-header no-print">
        <div className="brand-lockup">
          <img className="brand-logo" src="/logo.png" alt="J~pharma Laboratories Limited" />
        </div>
        <div className="header-actions">
          <span className="save-status"><span className="save-dot" /> Saved in this browser</span>
          <button className="button primary" type="button" onClick={() => window.print()}><Icon name="printer" size={16} /> Print / Save PDF</button>
        </div>
      </header>

      <main className="app-main">
        <div className="page-intro no-print">
          <div>
            <p className="eyebrow">Schedule workspace</p>
            <h1>Build your monthly coverage plan.</h1>
            <p className="intro-copy">Click any calendar date to add or edit employee slots. Use the recurring pattern only when the same schedule repeats.</p>
            <label className="workspace-title-editor" htmlFor="schedule-title">
              <span>Printed schedule title</span>
              <input
                id="schedule-title"
                value={state.scheduleTitle}
                onChange={(event) => updateState((current) => ({ ...current, scheduleTitle: event.target.value }))}
                placeholder="e.g. Pharmacists Schedule"
                maxLength={70}
              />
            </label>
          </div>
          <div className="setup-progress" aria-label="Setup progress">
            <div className={`progress-step ${state.employees.length > 0 ? 'complete' : 'active'}`}><span>{state.employees.length > 0 ? '✓' : '1'}</span> Team</div>
            <div className="progress-line" />
            <div className={`progress-step ${totalTemplateEntries > 0 ? 'complete' : state.employees.length > 0 ? 'active' : ''}`}><span>{totalTemplateEntries > 0 ? '✓' : '2'}</span> Pattern</div>
            <div className="progress-line" />
            <div className="progress-step active"><span>3</span> Calendar</div>
          </div>
        </div>

        <div className="workspace-layout">
          <aside className="control-rail no-print">
            <EmployeeManager employees={state.employees} onAdd={addEmployee} onRename={renameEmployee} onDelete={deleteEmployee} onMove={moveEmployee} />
            <TemplateEditor employees={state.employees} template={state.weeklyTemplate} onUpdateDay={updateTemplateDay} onUpdateDays={updateTemplateDays} />
          </aside>

          <section className="schedule-area">
            <SavedTemplatesBar
              templates={state.templates}
              activeTemplateId={state.activeTemplateId}
              onSelect={loadTemplate}
              onSave={openTemplateNameModal}
              onUpdate={updateActiveTemplate}
              onDelete={deleteActiveTemplate}
            />
            <div className="month-toolbar no-print">
              <div className="month-title-group">
                <p className="eyebrow">Your schedule</p>
                <h2>{formatMonthYear(state.selectedYear, state.selectedMonth)}</h2>
              </div>
              <div className="month-actions">
                <div className="month-picker" aria-label="Choose schedule month">
                  <button className="icon-button" type="button" onClick={previousMonth} aria-label="Previous month" title="Previous month"><Icon name="arrow-left" /></button>
                  <select value={state.selectedMonth} onChange={(event) => changeMonth(state.selectedYear, Number(event.target.value))} aria-label="Month">
                    {MONTHS.map((month, index) => <option value={index} key={month}>{month}</option>)}
                  </select>
                  <input
                    type="number"
                    value={state.selectedYear}
                    min={1900}
                    max={2200}
                    onChange={(event) => {
                      const year = Number(event.target.value)
                      if (Number.isInteger(year) && year >= 1900 && year <= 2200) changeMonth(year, state.selectedMonth)
                    }}
                    aria-label="Year"
                  />
                  <button className="icon-button" type="button" onClick={nextMonth} aria-label="Next month" title="Next month"><Icon name="arrow-right" /></button>
                </div>
                <button className="button secondary" type="button" onClick={goToCurrentMonth}>Today</button>
                <button className="button ghost" type="button" onClick={regenerateMonth}><Icon name="refresh" size={15} /> Regenerate</button>
              </div>
            </div>

            <ScheduleCalendar
              year={state.selectedYear}
              month={state.selectedMonth}
              scheduleTitle={state.scheduleTitle}
              employees={state.employees}
              template={state.weeklyTemplate}
              overrides={state.currentMonthOverrides}
              onEditDate={setSelectedDate}
            />

            <div className="schedule-tip no-print">
              <div className="tip-icon"><Icon name="edit" size={16} /></div>
              <div><strong>Fastest workflow.</strong><span>Click any calendar date to add or edit its employees, times, or note.</span></div>
            </div>
          </section>
        </div>
      </main>

      {selectedDate && selectedDay && (
        <DayEditorModal
          date={selectedDate}
          initialDay={selectedDay.day}
          isOverride={selectedDay.isOverride}
          employees={state.employees}
          onClose={() => setSelectedDate(null)}
          onSave={saveDateOverride}
          onReset={resetDateOverride}
        />
      )}

      {templateNameModalOpen && (
        <TextInputModal
          title="Save this schedule template"
          description="Save the current employee list and recurring shift times so you can reuse them in any month."
          label="Template name"
          initialValue="Standard Schedule"
          placeholder="e.g. Standard Schedule"
          submitLabel="Save template"
          onClose={() => setTemplateNameModalOpen(false)}
          onSubmit={saveCurrentAsTemplate}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          eyebrow={confirmAction.eyebrow}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          danger={confirmAction.danger}
          icon={confirmAction.icon}
          onClose={() => setConfirmAction(null)}
          onConfirm={acceptConfirmAction}
        />
      )}

      {toast && <div className="toast" role="status"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  )
}

export default App
