import { loadString, saveString } from './storage'

const THEME_PRESET_KEY = 'lowtrello.theme_preset.v1'
const DEFAULT_PRESET = 'classic'

const THEME_PRESETS = {
  classic: {
    colorPrimary: '#0052d9',
    colorBg: '#f0f2f5',
    colorPanel: '#ebecf0',
    glow1: 'rgba(0, 82, 217, 0.07)',
    glow2: 'rgba(11, 152, 113, 0.08)'
  },
  ocean: {
    colorPrimary: '#0a5d8d',
    colorBg: '#edf5fb',
    colorPanel: '#e1ecf5',
    glow1: 'rgba(17, 97, 158, 0.1)',
    glow2: 'rgba(32, 166, 175, 0.1)'
  },
  sunset: {
    colorPrimary: '#b45309',
    colorBg: '#fbf3ec',
    colorPanel: '#f2e6d9',
    glow1: 'rgba(200, 104, 38, 0.14)',
    glow2: 'rgba(199, 53, 90, 0.11)'
  }
}

function normalizePresetName(name) {
  return Object.prototype.hasOwnProperty.call(THEME_PRESETS, name) ? name : DEFAULT_PRESET
}

export function getSavedThemePreset() {
  return normalizePresetName(loadString(THEME_PRESET_KEY, DEFAULT_PRESET))
}

export function applyThemePreset(name) {
  const normalizedName = normalizePresetName(name)
  const preset = THEME_PRESETS[normalizedName]

  if (typeof document !== 'undefined') {
    const root = document.documentElement
    root.dataset.lowtrelloTheme = normalizedName
    root.style.setProperty('--color-primary', preset.colorPrimary)
    root.style.setProperty('--color-bg', preset.colorBg)
    root.style.setProperty('--color-panel', preset.colorPanel)
    root.style.setProperty('--bg-glow-1', preset.glow1)
    root.style.setProperty('--bg-glow-2', preset.glow2)
  }

  saveString(THEME_PRESET_KEY, normalizedName)
  return normalizedName
}

export function getThemePresets() {
  return { ...THEME_PRESETS }
}
