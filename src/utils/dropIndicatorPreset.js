import { loadString, saveString } from './storage'

const DROP_INDICATOR_PRESET_KEY = 'lowtrello.drop_indicator_preset.v1'
const DEFAULT_PRESET = 'standard'

const DROP_INDICATOR_PRESETS = {
  soft: {
    lineThickness: 3,
    glowRadius: 1.5,
    motionDuration: 110
  },
  standard: {
    lineThickness: 4,
    glowRadius: 2,
    motionDuration: 145
  },
  strong: {
    lineThickness: 5,
    glowRadius: 2.8,
    motionDuration: 180
  }
}

function normalizePresetName(name) {
  return Object.prototype.hasOwnProperty.call(DROP_INDICATOR_PRESETS, name) ? name : DEFAULT_PRESET
}

export function getSavedDropIndicatorPreset() {
  return normalizePresetName(loadString(DROP_INDICATOR_PRESET_KEY, DEFAULT_PRESET))
}

export function applyDropIndicatorPreset(name) {
  const normalizedName = normalizePresetName(name)
  const preset = DROP_INDICATOR_PRESETS[normalizedName]

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.dropIndicatorPreset = normalizedName
    document.documentElement.style.setProperty('--drop-indicator-line-thickness', `${preset.lineThickness}px`)
    document.documentElement.style.setProperty('--drop-indicator-glow-radius', `${preset.glowRadius}px`)
    document.documentElement.style.setProperty('--drop-indicator-motion-duration', `${preset.motionDuration}ms`)
  }

  saveString(DROP_INDICATOR_PRESET_KEY, normalizedName)
  return normalizedName
}

export function getDropIndicatorPresets() {
  return { ...DROP_INDICATOR_PRESETS }
}
