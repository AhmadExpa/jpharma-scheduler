import { useEffect, useState } from 'react'
import Icon from './components/Icon'
import InfoTag from './components/InfoTag'
import ScheduleCalendar from './components/ScheduleCalendar'
import DayEditorModal from './components/DayEditorModal'
import SimpleDayEditorModal from './components/SimpleDayEditorModal'
import SimpleSetupCard from './components/SimpleSetupCard'
import TemplateEditor from './components/TemplateEditor'
import SavedTemplatesBar from './components/SavedTemplatesBar'
import ConfirmModal from './components/ConfirmModal'
import TextInputModal from './components/TextInputModal'
import {
  cloneWeeklyTemplate,
  createId,
  createDefaultTemplate,
  createSimpleWeeklyTemplate,
  dateKey,
  formatMonthYear,
  getDaySchedule,
  getTemplateOverridesForMonth as getMonthTemplateOverrides,
  MONTHS,
} from './dateUtils'
import { loadState, saveState } from './storage'
import type { DaySchedule, Employee, SchedulerState, ScheduleTemplate, Weekday } from './types'

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
  const [advancedDayEditorOpen, setAdvancedDayEditorOpen] = useState(false)

  useEffect(() => saveState(state), [state])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const selectedDay = selectedDate
    ? getDaySchedule(selectedDate, state.weeklyTemplate, state.currentMonthOverrides)
    : null

  const hasSchedule = [0, 1, 2, 3, 4, 5, 6].some((day) => state.weeklyTemplate[day as Weekday].entries.length > 0)

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
      employees: [...current.employees, { id: `employee-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: cleanName, defaultTime: null }],
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

  function updateEmployeeTime(id: string, time: string) {
    updateState((current) => ({
      ...current,
      employees: current.employees.map((employee) => employee.id === id ? { ...employee, defaultTime: time || null } : employee),
    }))
  }

  function deleteEmployee(id: string) {
    const employee = state.employees.find((item) => item.id === id)
    if (!employee) return
    setConfirmAction({
      eyebrow: 'Team member',
      title: `Remove ${employee.name}?`,
      message: 'Their schedule will be removed from the calendar and any saved one-day changes.',
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

  function updateTemplateDays(updates: Partial<Record<Weekday, DaySchedule>>) {
    updateState((current) => ({
      ...current,
      weeklyTemplate: { ...current.weeklyTemplate, ...updates },
    }))
    showToast('Weekly schedule updated')
  }

  function applySimpleSchedule() {
    if (state.employees.length === 0 || state.employees.some((employee) => !employee.defaultTime)) {
      showToast(state.employees.length === 0 ? 'Add an employee first' : 'Add a time for every employee')
      return
    }

    updateState((current) => ({
      ...current,
      weeklyTemplate: createSimpleWeeklyTemplate(current.employees, current.weeklyTemplate),
      activeTemplateId: null,
    }))
    setSelectedDate(null)
    setAdvancedDayEditorOpen(false)
    showToast(`Schedule added to ${formatMonthYear(state.selectedYear, state.selectedMonth)}`)
    window.requestAnimationFrame(() => document.getElementById('calendar-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
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
      monthDayOverrides: {},
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
    const monthOverrides = getMonthTemplateOverrides(template, state.selectedYear, state.selectedMonth)
    updateState((current) => ({
      ...current,
      employees: template.employees.map((employee) => ({ ...employee })),
      weeklyTemplate: cloneWeeklyTemplate(template.weeklyTemplate),
      activeTemplateId: template.id,
      currentMonthOverrides: monthOverrides,
    }))
    setSelectedDate(null)
    setAdvancedDayEditorOpen(false)
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
    return activeTemplate ? getMonthTemplateOverrides(activeTemplate, year, month) : {}
  }

  function changeMonth(year: number, month: number, message = 'This month has one-day changes. Change the month anyway?') {
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

  function resetCalendar() {
    setConfirmAction({
      eyebrow: 'Warning',
      title: 'Reset this calendar?',
      message: 'This will permanently remove all recurring shifts and date-specific changes from this schedule. Your employees, title, and saved templates will stay in place. This action cannot be undone.',
      confirmLabel: 'Reset calendar',
      danger: true,
      icon: 'refresh',
      onConfirm: resetCurrentCalendar,
    })
  }

  function startFresh() {
    setConfirmAction({
      eyebrow: 'Start fresh',
      title: 'Start a blank schedule?',
      message: 'This removes the current employees and calendar changes. Saved schedules will stay available under More options.',
      confirmLabel: 'Start fresh',
      danger: true,
      icon: 'refresh',
      onConfirm: startFreshWorkspace,
    })
  }

  function startFreshWorkspace() {
    updateState((current) => ({
      ...current,
      scheduleTitle: 'Staff Schedule',
      employees: [],
      weeklyTemplate: createDefaultTemplate(),
      currentMonthOverrides: {},
      activeTemplateId: null,
    }))
    setSelectedDate(null)
    setAdvancedDayEditorOpen(false)
    showToast('Blank schedule ready')
  }

  function resetCurrentCalendar() {
    updateState((current) => ({
      ...current,
      weeklyTemplate: createDefaultTemplate(),
      currentMonthOverrides: {},
      activeTemplateId: null,
    }))
    setSelectedDate(null)
    showToast('Calendar reset — your team and saved templates were kept')
  }

  function saveDateOverride(day: DaySchedule) {
    if (!selectedDate) return
    updateState((current) => ({
      ...current,
      currentMonthOverrides: { ...current.currentMonthOverrides, [dateKey(selectedDate)]: day },
    }))
    setSelectedDate(null)
    setAdvancedDayEditorOpen(false)
    showToast('Day saved')
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
    setAdvancedDayEditorOpen(false)
    showToast('Day reset to the weekly schedule')
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
          <InfoTag className="header-info-tag"><span className="save-dot" /> Saved automatically here</InfoTag>
          <button className="button primary" type="button" onClick={() => window.print()}><Icon name="printer" size={16} /> Print / Save PDF</button>
        </div>
      </header>

      <main className="app-main">
        <div className="page-intro no-print">
          <div>
            <p className="eyebrow">Monthly staff schedule</p>
            <h1>Make your schedule in minutes.</h1>
            <p className="intro-copy">Add your employees and their start times. We will place them on the calendar automatically.</p>
          </div>
        </div>

        <div className="simple-workspace">
          <SimpleSetupCard
            employees={state.employees}
            hasSchedule={hasSchedule}
            onAdd={addEmployee}
            onRename={renameEmployee}
            onTimeChange={updateEmployeeTime}
            onDelete={deleteEmployee}
            onApply={applySimpleSchedule}
          />
          <section className="schedule-area">
            <div className="month-toolbar no-print">
              <div className="month-title-group">
                <p className="eyebrow">Your calendar</p>
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
              </div>
            </div>

            <ScheduleCalendar
              year={state.selectedYear}
              month={state.selectedMonth}
              scheduleTitle={state.scheduleTitle}
              employees={state.employees}
              template={state.weeklyTemplate}
              overrides={state.currentMonthOverrides}
              onEditDate={(date) => { setSelectedDate(date); setAdvancedDayEditorOpen(false) }}
            />

          </section>

          <details className="advanced-options no-print">
            <summary><Icon name="settings" size={16} /> More options</summary>
            <div className="advanced-options-body">
              <div className="advanced-title-row">
                <div>
                  <p className="eyebrow">Optional</p>
                  <h2>Extra tools</h2>
                  <p>These tools are only needed for saved schedules or more complicated setups.</p>
                </div>
                <label className="workspace-title-editor" htmlFor="schedule-title">
                  <span>Printed schedule title</span>
                  <input
                    id="schedule-title"
                    value={state.scheduleTitle}
                    onChange={(event) => updateState((current) => ({ ...current, scheduleTitle: event.target.value }))}
                    placeholder="Staff Schedule"
                    maxLength={70}
                  />
                </label>
              </div>
              <SavedTemplatesBar
                templates={state.templates}
                activeTemplateId={state.activeTemplateId}
                onSelect={loadTemplate}
                onSave={openTemplateNameModal}
                onUpdate={updateActiveTemplate}
                onDelete={deleteActiveTemplate}
              />
              <div className="advanced-tools-grid">
                <TemplateEditor employees={state.employees} template={state.weeklyTemplate} onUpdateDays={updateTemplateDays} />
                <div className="advanced-actions">
                  <button className="button ghost" type="button" onClick={startFresh}><Icon name="refresh" size={15} /> Start fresh</button>
                  <button className="button ghost danger-text advanced-reset-button" type="button" onClick={resetCalendar} title="Clear all shifts from this calendar"><Icon name="refresh" size={15} /> Reset calendar</button>
                </div>
              </div>
            </div>
          </details>
        </div>
      </main>

      {selectedDate && selectedDay && (
        advancedDayEditorOpen ? (
          <DayEditorModal
            date={selectedDate}
            initialDay={selectedDay.day}
            isOverride={selectedDay.isOverride}
            employees={state.employees}
            onClose={() => { setSelectedDate(null); setAdvancedDayEditorOpen(false) }}
            onSave={saveDateOverride}
            onReset={resetDateOverride}
          />
        ) : (
          <SimpleDayEditorModal
            date={selectedDate}
            initialDay={selectedDay.day}
            isOverride={selectedDay.isOverride}
            employees={state.employees}
            onClose={() => setSelectedDate(null)}
            onSave={saveDateOverride}
            onReset={resetDateOverride}
            onOpenAdvanced={() => setAdvancedDayEditorOpen(true)}
          />
        )
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
