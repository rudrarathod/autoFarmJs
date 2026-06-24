import { useEffect, useRef } from 'react'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import { useGameStore } from '../../store/gameStore.js'
import MaterialIcon from '../common/MaterialIcon.jsx'
import './BlocklyEditor.css'
import { validateVariableName } from './customBlocks.js'

// ----------------------------------------------------
// 1. CUSTOM FLAT RENDERER (RETRO PIXEL EDGES)
// ----------------------------------------------------
class RetroConstantProvider extends Blockly.blockRendering.ConstantProvider {
  constructor() {
    super()
    // Must be set BEFORE super.init() so derived shapes (INSIDE_CORNERS,
    // OUTSIDE_CORNERS) are built with 0-radius — the root cause of misalignment.
    this.CORNER_RADIUS = 0
    // Tighten internal spacing so blocks fit flush inside C-shape mouths, but keep padding for fields
    this.MEDIUM_PADDING = 6
    this.LARGE_PADDING = 8
    this.BETWEEN_STATEMENT_PADDING_Y = 0
    this.STATEMENT_BOTTOM_SPACER = -this.NOTCH_HEIGHT
    // Thick bottom bar so the floor notch has room and doesn't break through
    this.BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT = 20
  }
}

// Custom Drawer: adds a V-valley notch on the C-shape floor (inside bottom)
class RetroDrawer extends Blockly.blockRendering.Drawer {
  drawStatementInput_(row) {
    const input = row.getLastInput()
    if (!input) return

    const c = input.xPos + input.notchOffset + input.shape.width
    const topPath =
      input.shape.pathRight +
      `h ${-(input.notchOffset - this.constants_.INSIDE_CORNERS.width)}` +
      this.constants_.INSIDE_CORNERS.pathTop
    const wallHeight = row.height - 2 * this.constants_.INSIDE_CORNERS.height

    // Floor notch: use ABSOLUTE coordinates to guarantee alignment.
    // The top notch spans from x=(input.xPos + input.notchOffset) to x=c.
    // The floor notch must occupy the exact same horizontal range.
    const notch = this.constants_.NOTCH
    const floorNotchStart = input.xPos + input.notchOffset
    const floorEnd = row.xPos + row.width

    this.outlinePath_ +=
      `H ${c}` +                                    // right edge to C-shape opening
      topPath +                                     // inside top corner + notch + left wall top
      `v ${wallHeight}` +                           // left wall going down
      this.constants_.INSIDE_CORNERS.pathBottom +    // inside bottom-left corner
      `H ${floorNotchStart}` +                      // floor to notch start (ABSOLUTE — no guessing)
      notch.pathLeft +                              // V-valley notch indent
      `H ${floorEnd}`                               // floor after notch to right edge

    this.positionStatementInputConnection_(row)
  }
}

class RetroRenderer extends Blockly.blockRendering.Renderer {
  makeConstants_() {
    return new RetroConstantProvider()
  }
  makeDrawer_(block, info) {
    return new RetroDrawer(block, info)
  }
}

// Generate a unique renderer name to bypass React hot-reloading cache
const RENDERER_NAME = 'retro_' + Math.random().toString(36).substring(2, 9);
Blockly.blockRendering.register(RENDERER_NAME, RetroRenderer);

// Block definitions and C++ generators have been refactored to customBlocks.js

// ----------------------------------------------------
// 4. DEFAULT WORKSPACE STATE
// ----------------------------------------------------
const DEFAULT_WORKSPACE_STATE = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "arduino_setup",
        "x": 20,
        "y": 20,
        "deletable": false,
        "inputs": {
          "STACK": {
            "block": {
              "type": "serial_print",
              "inputs": {
                "MSG": {
                  "block": {
                    "type": "text",
                    "fields": {
                      "TEXT": "Drone system initialized!"
                    }
                  }
                }
              }
            }
          }
        },
        "next": {
          "block": {
            "type": "arduino_loop",
            "deletable": false
          }
        }
      }
    ]
  }
}

const CLEAN_WORKSPACE_STATE = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "arduino_setup",
        "x": 20,
        "y": 20,
        "deletable": false,
        "next": {
          "block": {
            "type": "arduino_loop",
            "deletable": false
          }
        }
      }
    ]
  }
}

// ----------------------------------------------------
// 5. DYNAMIC TOOLBOX GENERATION
// ----------------------------------------------------
function getToolboxConfig(unlockedNodes) {
  // Overridden to always return true, disabling the progress lock tree to show all custom blocks
  const isUnlocked = (nodeId) => true;

  const categories = [];

  // Category 1: System
  categories.push({
    "kind": "category",
    "name": "📟 System",
    "colour": "190",
    "contents": [
      { "kind": "label", "text": "📟 SYSTEM", "web-class": "flyout-category-title" },
      { "kind": "block", "type": "arduino_setup" },
      { "kind": "block", "type": "arduino_loop" },
      {
        "kind": "block",
        "type": "time_delay",
        "inputs": {
          "MS": {
            "block": {
              "type": "number_constant_cpp",
              "fields": { "NUM": 1000 }
            }
          }
        }
      },
      { "kind": "block", "type": "system_return" }
    ]
  });

  // Category 2: Drone
  categories.push({
    "kind": "category",
    "name": "🚁 Drone",
    "colour": "160",
    "contents": [
      { "kind": "label", "text": "🚁 DRONE", "web-class": "flyout-category-title" },
      { "kind": "block", "type": "drone_till" },
      {
        "kind": "block",
        "type": "drone_plant",
        "fields": { "CROP": "wheat" }
      },
      { "kind": "block", "type": "drone_harvest" },
      { "kind": "block", "type": "drone_move_next" },
      {
        "kind": "block",
        "type": "drone_move_to",
        "inputs": {
          "ROW": {
            "block": {
              "type": "number_constant_cpp",
              "fields": { "NUM": 0 }
            }
          },
          "COL": {
            "block": {
              "type": "number_constant_cpp",
              "fields": { "NUM": 0 }
            }
          }
        }
      },
      { "kind": "block", "type": "drone_charge" }
    ]
  });

  // Category 3: Sensors
  categories.push({
    "kind": "category",
    "name": "📡 Sensors",
    "colour": "210",
    "contents": [
      { "kind": "label", "text": "📡 SENSORS", "web-class": "flyout-category-title" },
      { "kind": "block", "type": "sensor_is_turf" },
      { "kind": "block", "type": "sensor_is_soil" },
      { "kind": "block", "type": "sensor_is_growing" },
      { "kind": "block", "type": "sensor_is_ripe" },
      { "kind": "block", "type": "sensor_is_ore" },
      { "kind": "block", "type": "sensor_get_energy" },
      { "kind": "block", "type": "sensor_position_row" },
      { "kind": "block", "type": "sensor_position_col" },
      { "kind": "block", "type": "sensor_grid_size" }
    ]
  });

  // Category 4: Variables
  categories.push({
    "kind": "category",
    "name": "🟦 Variables",
    "colour": "210",
    "contents": [
      { "kind": "label", "text": "🟦 VARIABLES", "web-class": "flyout-category-title" },
      {
        "kind": "block",
        "type": "var_declare_int",
        "inputs": {
          "VALUE": {
            "block": {
              "type": "number_constant_cpp",
              "fields": { "NUM": 0 }
            }
          }
        }
      },
      {
        "kind": "block",
        "type": "var_declare_float",
        "inputs": {
          "VALUE": {
            "block": {
              "type": "number_constant_cpp",
              "fields": { "NUM": 0 }
            }
          }
        }
      },
      {
        "kind": "block",
        "type": "var_declare_bool",
        "inputs": {
          "VALUE": {
            "block": {
              "type": "logic_boolean_cpp",
              "fields": { "BOOL": "FALSE" }
            }
          }
        }
      },
      {
        "kind": "block",
        "type": "var_declare_string",
        "inputs": {
          "VALUE": {
            "block": {
              "type": "crop_species",
              "fields": { "CROP": "wheat" }
            }
          }
        }
      },
      { "kind": "block", "type": "var_set" },
      { "kind": "block", "type": "variables_get" }
    ]
  });

  // Category 5: Logic
  categories.push({
    "kind": "category",
    "name": "🟩 Logic",
    "colour": "120",
    "contents": [
      { "kind": "label", "text": "🟩 LOGIC", "web-class": "flyout-category-title" },
      { "kind": "block", "type": "controls_if_simple" },
      { "kind": "block", "type": "controls_if_else" },
      { "kind": "block", "type": "logic_compare_cpp" },
      { "kind": "block", "type": "logic_operation_cpp" },
      { "kind": "block", "type": "logic_negate_cpp" },
      { "kind": "block", "type": "logic_boolean_cpp" }
    ]
  });

  // Category 6: Loops
  categories.push({
    "kind": "category",
    "name": "🟨 Loops",
    "colour": "45",
    "contents": [
      { "kind": "label", "text": "🟨 LOOPS", "web-class": "flyout-category-title" },
      {
        "kind": "block",
        "type": "controls_for_cpp",
        "inputs": {
          "START": {
            "block": {
              "type": "number_constant_cpp",
              "fields": { "NUM": 0 }
            }
          },
          "END": {
            "block": {
              "type": "number_constant_cpp",
              "fields": { "NUM": 10 }
            }
          }
        }
      },
      { "kind": "block", "type": "controls_while_cpp" },
      { "kind": "block", "type": "loop_control" }
    ]
  });

  // Category 7: Functions
  categories.push({
    "kind": "category",
    "name": "🟧 Functions",
    "colour": "290",
    "custom": "PROCEDURE"
  });

  // Category 8: Constants
  categories.push({
    "kind": "category",
    "name": "💎 Constants",
    "colour": "180",
    "contents": [
      { "kind": "label", "text": "💎 CONSTANTS", "web-class": "flyout-category-title" },
      { "kind": "block", "type": "crop_species" },
      { "kind": "block", "type": "tile_type_constant" },
      { "kind": "block", "type": "number_constant_cpp" },
      { "kind": "block", "type": "string_constant_cpp" }
    ]
  });

  // Category 9: Operators
  categories.push({
    "kind": "category",
    "name": "➕ Operators",
    "colour": "230",
    "contents": [
      { "kind": "label", "text": "➕ OPERATORS", "web-class": "flyout-category-title" },
      { "kind": "block", "type": "operator_arithmetic_cpp" },
      { "kind": "block", "type": "operator_inc_dec_cpp" },
      { "kind": "block", "type": "operator_compound_cpp" }
    ]
  });

  // Category 10: Debug
  categories.push({
    "kind": "category",
    "name": "🐞 Debug",
    "colour": "190",
    "contents": [
      { "kind": "label", "text": "🐞 DEBUG", "web-class": "flyout-category-title" },
      {
        "kind": "block",
        "type": "serial_debug_cpp",
        "inputs": {
          "VALUE": {
            "block": {
              "type": "string_constant_cpp",
              "fields": { "TEXT": "hello" }
            }
          }
        }
      }
    ]
  });

  return {
    "kind": "categoryToolbox",
    "contents": categories
  };
}

const themeColors = {
  'solar-punk': {
    logic: '#d19a66',
    loop: '#c678dd',
    math: '#d19a66',
    text: '#56b6c2',
    variable: '#e5c07b',
    procedure: '#e06c75',
    control: '#c678dd',
    action: '#4caf50',
    sensor: '#2196f3',
    system: '#9e9e9e',
    marker: '#81c784'
  },
  'cyber-punk': {
    logic: '#ff00ff',
    loop: '#00ffff',
    math: '#ffcc00',
    text: '#00ff66',
    variable: '#ff5500',
    procedure: '#ff0055',
    control: '#9900ff',
    action: '#00ff66',
    sensor: '#00f0ff',
    system: '#7f7f7f',
    marker: '#00ff66'
  },
  'classic-amber': {
    logic: '#e69d00',
    loop: '#cc8b00',
    math: '#ffd166',
    text: '#ffb000',
    variable: '#ff9f00',
    procedure: '#b37b00',
    control: '#996900',
    action: '#ffd166',
    sensor: '#ffb000',
    system: '#805800',
    marker: '#ffb000'
  },
  'alabaster-light': {
    logic: '#e28743',
    loop: '#76b5c5',
    math: '#e2b043',
    text: '#873e23',
    variable: '#1e3d59',
    procedure: '#ff6e40',
    control: '#76b5c5',
    action: '#2e5a27',
    sensor: '#1976d2',
    system: '#616161',
    marker: '#4caf50'
  }
}

// Initial theme definition (valid static colors to pass inject time validations)
const initialTheme = Blockly.Theme.defineTheme('ruralTheme_initial', {
  'base': Blockly.Themes.Classic,
  'blockStyles': {
    'logic_blocks': { 'colourPrimary': '#d19a66', 'colourSecondary': '#d19a66' },
    'loop_blocks': { 'colourPrimary': '#c678dd', 'colourSecondary': '#c678dd' },
    'math_blocks': { 'colourPrimary': '#d19a66', 'colourSecondary': '#d19a66' },
    'text_blocks': { 'colourPrimary': '#56b6c2', 'colourSecondary': '#56b6c2' },
    'variable_blocks': { 'colourPrimary': '#e5c07b', 'colourSecondary': '#e5c07b' },
    'procedure_blocks': { 'colourPrimary': '#e06c75', 'colourSecondary': '#e06c75' },
    'control_blocks': { 'colourPrimary': '#c678dd', 'colourSecondary': '#c678dd' },
    'action_blocks': { 'colourPrimary': '#4caf50', 'colourSecondary': '#4caf50' },
    'sensor_blocks': { 'colourPrimary': '#2196f3', 'colourSecondary': '#2196f3' },
    'system_blocks': { 'colourPrimary': '#9e9e9e', 'colourSecondary': '#9e9e9e' }
  },
  'componentStyles': {
    'workspaceBackgroundColour': 'var(--color-ui-bg-paper, #1e1e2e)',
    'toolboxBackgroundColour': 'var(--color-surface, #191a24)',
    'toolboxForegroundColour': 'var(--color-on-surface, #cdd6f4)',
    'flyoutBackgroundColour': 'var(--color-surface-container-low, #1e1e2e)',
    'flyoutForegroundColour': 'var(--color-on-surface, #cdd6f4)',
    'scrollbarColour': '#6c7086',
    'scrollbarOpacity': 0.9,
    'insertionMarkerColour': '#81c784',
    'insertionMarkerOpacity': 0.2
  }
})

export default function BlocklyEditor() {
  const blocklyDivRef = useRef(null)
  const workspaceRef = useRef(null)

  const unlockedNodes = useGameStore((s) => s.unlockedNodes)
  const droneBlocklyWorkspace = useGameStore((s) => s.droneBlocklyWorkspace)
  const colorTheme = useGameStore((s) => s.settings?.colorTheme || 'solar-punk')

  // Initialize Blockly Workspace
  useEffect(() => {
    if (!blocklyDivRef.current) return

    // Inject Blockly
    const workspace = Blockly.inject(blocklyDivRef.current, {
      toolbox: getToolboxConfig(unlockedNodes),
      theme: initialTheme,
      renderer: RENDERER_NAME, // Custom flat pixelated block renderer
      grid: {
        spacing: 20,
        length: 3,
        colour: '#2c313c',
        snap: true
      },
      zoom: {
        controls: false,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
      },
      trashcan: false,
      move: {
        scrollbars: true,
        drag: false,
        wheel: true
      }
    })

    // Retrieve default procedure category callback if registered
    const defaultCallback = workspace.getToolboxCategoryCallback
      ? workspace.getToolboxCategoryCallback('PROCEDURE')
      : null

    // Register custom category callback for PROCEDURE to inject custom return block
    workspace.registerToolboxCategoryCallback('PROCEDURE', (ws) => {
      let blocksList = []
      if (defaultCallback) {
        try {
          blocksList = defaultCallback(ws)
        } catch (err) {
          console.error('Error calling default procedure callback:', err)
        }
      } else if (Blockly.Procedures && typeof Blockly.Procedures.flyoutCategory === 'function') {
        try {
          blocksList = Blockly.Procedures.flyoutCategory(ws)
        } catch (err) {
          console.error('Error calling Blockly.Procedures.flyoutCategory:', err)
        }
      }
      
      // Determine if the returned blocksList contains JSON definition objects or XML nodes
      const isJson = blocksList.length > 0
        ? (typeof blocksList[0] === 'object' && !blocksList[0].nodeType)
        : true;
      
      if (isJson) {
        blocksList.unshift({
          "kind": "label",
          "text": "🟧 FUNCTIONS",
          "web-class": "flyout-category-title"
        });
        blocksList.push({
          "kind": "block",
          "type": "procedures_return"
        });
      } else {
        // Fallback to XML DOM node
        const labelBlock = Blockly.utils?.xml?.createElement
          ? Blockly.utils.xml.createElement('label')
          : document.createElement('label');
        labelBlock.setAttribute('text', '🟧 FUNCTIONS');
        labelBlock.setAttribute('web-class', 'flyout-category-title');
        blocksList.unshift(labelBlock);

        const returnBlock = Blockly.utils?.xml?.createElement
          ? Blockly.utils.xml.createElement('block')
          : document.createElement('block');
        returnBlock.setAttribute('type', 'procedures_return');
        blocksList.push(returnBlock);
      }
      
      return blocksList
    })

    workspaceRef.current = workspace

    // Monkey-patch flyout to open to the LEFT (outside the drone logic panel).
    // Strategy: Override getX() on the flyout so Blockly positions it at
    // negative X (to the left of the toolbox). Also fix parent element overflow
    // and clip-path attributes that would hide the shifted flyout.
    let flyoutPatched = false
    const patchFlyout = () => {
      if (flyoutPatched) return
      const toolbox = workspace.getToolbox()
      const flyout = toolbox ? toolbox.getFlyout() : workspace.getFlyout()
      if (!flyout) return

      // Override getX to place flyout to the left with a small gap
      flyout.getX = function () {
        if (!this.isVisible()) return 0
        const gap = 16 // Margin between flyout and panel
        return -this.getWidth() - gap
      }

      // Override getWidth to enforce a minimum width so long category titles don't overflow!
      const origGetWidth = flyout.getWidth.bind(flyout)
      flyout.getWidth = function () {
        const baseWidth = origGetWidth()
        // Ensure minimum width of 280px to accommodate long custom C++ category titles
        return Math.max(baseWidth, 280)
      }

      // Override getFlyoutScale to prevent the flyout blocks from resizing with workspace zoom
      flyout.getFlyoutScale = function () {
        return 1.0
      }

      // Custom rounded background path with top/bottom margins
      flyout.setBackgroundPath_ = function (width, height) {
        const margin = 12
        const r = 8 // border radius
        const h = Math.max(0, height - margin * 2)
        const w = width
        
        const path = [
          `M 0,${margin + r}`,
          `a ${r},${r} 0 0 1 ${r},-${r}`,
          `h ${w - 2 * r}`,
          `a ${r},${r} 0 0 1 ${r},${r}`,
          `v ${h - 2 * r}`,
          `a ${r},${r} 0 0 1 -${r},${r}`,
          `h -${w - 2 * r}`,
          `a ${r},${r} 0 0 1 -${r},-${r}`,
          'z'
        ].join(' ')
        
        if (this.svgBackground_) {
          this.svgBackground_.setAttribute('d', path)
        }
      }

      // Override getClientRect for drag-target hit-testing
      const origGetClientRect = flyout.getClientRect.bind(flyout)
      flyout.getClientRect = function () {
        const rect = origGetClientRect()
        if (!rect || !this.svgGroup_) return rect
        const svgRect = this.svgGroup_.getBoundingClientRect()
        return new Blockly.utils.Rect(svgRect.top, svgRect.bottom, svgRect.left, svgRect.right)
      }

      // Force overflow visible on Blockly's internal DOM containers
      const injectionDiv = blocklyDivRef.current?.querySelector('.injectionDiv')
      if (injectionDiv) {
        injectionDiv.style.overflow = 'visible'
      }
      const blocklySvg = blocklyDivRef.current?.querySelector('.blocklySvg')
      if (blocklySvg) {
        blocklySvg.style.overflow = 'visible'
        blocklySvg.setAttribute('overflow', 'visible')
      }
      // Ensure the flyout SVG group itself has no clipping
      if (flyout.svgGroup_) {
        flyout.svgGroup_.style.overflow = 'visible'
        flyout.svgGroup_.setAttribute('overflow', 'visible')
      }

      flyout.autoClose = false

      // Override position to align the title centered and draw a separator line
      const origPosition = flyout.position.bind(flyout)
      flyout.position = function () {
        origPosition()
        
        const labelText = this.svgGroup_?.querySelector('.flyout-category-title')
        const width = this.getWidth()
        const height = this.getHeight()

        if (labelText && this.svgGroup_) {
          labelText.setAttribute('x', (width / 2).toString())
          labelText.setAttribute('text-anchor', 'middle')
          
          // Shift the title text down slightly to fit beautifully within our floating card top margin
          const currentY = parseFloat(labelText.getAttribute('y') || '0')
          const targetY = Math.max(currentY, 28)
          labelText.setAttribute('y', targetY.toString())
          
          // Draw the dotted separator line as a sibling of the label text so it scrolls with it!
          const parent = labelText.parentNode
          if (parent) {
            let line = parent.querySelector('.flyout-title-separator')
            if (!line) {
              line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
              line.setAttribute('class', 'flyout-title-separator')
              parent.appendChild(line)
            }
            line.setAttribute('x1', '16')
            line.setAttribute('y1', (targetY + 12).toString())
            line.setAttribute('x2', (width - 16).toString())
            line.setAttribute('y2', (targetY + 12).toString())
            line.setAttribute('stroke', 'var(--color-outline)')
            line.setAttribute('stroke-width', '2')
            line.setAttribute('stroke-dasharray', '4 4')
          }
        } else if (this.svgGroup_) {
          // Remove any stray separators from the main group
          const lines = this.svgGroup_.querySelectorAll('.flyout-title-separator')
          lines.forEach(l => l.remove())
        }

        // Clean up any stale fade indicators from previous renders
        if (this.svgGroup_) {
          const staleFade = this.svgGroup_.querySelector('.flyout-bottom-fade-rect')
          if (staleFade) staleFade.remove()
          const staleDefs = this.svgGroup_.querySelector('.flyout-defs')
          if (staleDefs) staleDefs.remove()
        }

        // Force the flyout scrollbar to be visible and properly styled
        // The flyout workspace's scrollbar is at this.workspace_.scrollbar (a ScrollbarPair)
        // The vertical scrollbar is at .vScroll with .svgHandle, .svgBackground, .outerSvg
        const scrollbarPair = this.workspace_?.scrollbar
        if (scrollbarPair) {
          const vScroll = scrollbarPair.vScroll
          if (vScroll) {
            if (this.isVisible()) {
              // Ensure the scrollbar is visible
              if (typeof vScroll.setContainerVisible === 'function') {
                vScroll.setContainerVisible(true)
              }
              // Style the scrollbar handle to be clearly visible
              if (vScroll.svgHandle) {
                vScroll.svgHandle.setAttribute('fill', '#8a8fa8')
                vScroll.svgHandle.setAttribute('fill-opacity', '1')
                vScroll.svgHandle.setAttribute('width', '6')
                vScroll.svgHandle.setAttribute('rx', '3')
                vScroll.svgHandle.setAttribute('ry', '3')
              }
              // Make the scrollbar track visible
              if (vScroll.svgBackground) {
                vScroll.svgBackground.setAttribute('fill', '#313244')
                vScroll.svgBackground.setAttribute('fill-opacity', '0.3')
                vScroll.svgBackground.setAttribute('width', '6')
              }
              // Ensure the outer SVG wrapper is displayed and on top
              // In SVG, paint order = DOM order, so re-append to make it the last child
              if (vScroll.outerSvg) {
                vScroll.outerSvg.setAttribute('display', 'block')
                const parent = vScroll.outerSvg.parentNode
                if (parent) {
                  parent.appendChild(vScroll.outerSvg)
                }
              }
            } else {
              // Ensure it is hidden when flyout is closed
              if (vScroll.outerSvg) {
                vScroll.outerSvg.setAttribute('display', 'none')
              }
            }
          }
        }
      }

      // Override MetricsManager.getFlyoutMetrics to report 0 width.
      // This stops Blockly from shifting/scrolling the workspace blocks to the right
      // when the flyout opens.
      const metricsManager = workspace.getMetricsManager()
      if (metricsManager) {
        metricsManager.getFlyoutMetrics = function () {
          return {
            width: 0,
            height: 0,
            x: 0,
            y: 0
          }
        }
      }

      flyoutPatched = true
      // Force a re-position now that getX is patched
      flyout.position()
    }

    // Try patching immediately and on short delay
    patchFlyout()
    setTimeout(patchFlyout, 200)

    // Also patch when a toolbox item is selected (flyout becomes available)
    workspace.addChangeListener((event) => {
      if (event.type === 'toolbox_item_select') {
        // Small delay to let Blockly create/show the flyout first
        setTimeout(() => {
          flyoutPatched = false  // Allow re-patching
          patchFlyout()
        }, 50)
      }
    })

    const centerViewHorizontally = () => {
      if (!workspace) return
      const topBlocks = workspace.getTopBlocks(false)
      if (topBlocks.length === 0) return
      const metrics = workspace.getMetrics()
      if (!metrics) return
      const targetScrollX = metrics.contentLeft + metrics.contentWidth / 2 - metrics.viewWidth / 2
      workspace.scroll(targetScrollX, workspace.scrollY)
    }

    // Load initial workspace state
    try {
      const stateToLoad = droneBlocklyWorkspace || DEFAULT_WORKSPACE_STATE
      Blockly.serialization.workspaces.load(stateToLoad, workspace)
      setTimeout(() => {
        if (workspace) {
          workspace.zoomToFit()
          workspace.scrollCenter()
        }
      }, 50)
    } catch (err) {
      console.error('Failed to load Blockly workspace state:', err)
      Blockly.serialization.workspaces.load(DEFAULT_WORKSPACE_STATE, workspace)
      setTimeout(() => {
        if (workspace) {
          workspace.zoomToFit()
          workspace.scrollCenter()
        }
      }, 50)
    }

    // Listener to generate C++ code and update Zustand store
    const handleWorkspaceChange = (event) => {
      if (event.isUiEvent) return

      try {
        const state = Blockly.serialization.workspaces.save(workspace)
        let code = javascriptGenerator.workspaceToCode(workspace)
        code = code.trim() + '\n'

        useGameStore.getState().setDroneScript(code)
        useGameStore.setState({ droneBlocklyWorkspace: state })
      } catch (err) {
        console.error('Error generating block code:', err)
      }
    }

    // Listener to sanitize variable names on create/rename to enforce C++ identifiers
    const handleVariableValidation = (event) => {
      if (event.type === Blockly.Events.VAR_RENAME) {
        const sanitized = validateVariableName(event.newName)
        if (sanitized && sanitized !== event.newName) {
          workspace.renameVariableById(event.varId, sanitized)
        }
      } else if (event.type === Blockly.Events.VAR_CREATE) {
        const sanitized = validateVariableName(event.varName)
        if (sanitized && sanitized !== event.varName) {
          workspace.renameVariableById(event.varId, sanitized)
        }
      }
    }

    workspace.addChangeListener(handleWorkspaceChange)
    workspace.addChangeListener(handleVariableValidation)

    // Handle resizing
    let resizeTimeout = null
    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(workspace)
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(centerViewHorizontally, 50)
    })
    if (blocklyDivRef.current.parentNode) {
      resizeObserver.observe(blocklyDivRef.current.parentNode)
    }

    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      workspace.removeChangeListener(handleWorkspaceChange)
      workspace.removeChangeListener(handleVariableValidation)
      resizeObserver.disconnect()
      workspace.dispose()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close the flyout when clicking outside the drone logic panel
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!workspaceRef.current) return
      const flyout = workspaceRef.current.getFlyout()
      if (!flyout || !flyout.isVisible()) return

      // Check if the click target is inside the drone logic panel
      const insidePanel = e.target.closest('.drone-logic-panel')
      if (!insidePanel) {
        const toolbox = workspaceRef.current.getToolbox()
        if (toolbox && typeof toolbox.clearSelection === 'function') {
          toolbox.clearSelection()
        } else {
          flyout.hide()
        }
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick, { capture: true })
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick, { capture: true })
    }
  }, [])

  // Update toolbox configuration dynamically when skills unlock
  useEffect(() => {
    if (workspaceRef.current) {
      const newToolbox = getToolboxConfig(unlockedNodes)
      workspaceRef.current.updateToolbox(newToolbox)
    }
  }, [unlockedNodes])

  // Dynamically update theme based on settings.colorTheme change
  useEffect(() => {
    if (workspaceRef.current) {
      const colors = themeColors[colorTheme] || themeColors['solar-punk']
      const dynamicTheme = Blockly.Theme.defineTheme('ruralTheme_' + colorTheme, {
        'base': Blockly.Themes.Classic,
        'blockStyles': {
          'logic_blocks': { 'colourPrimary': colors.logic, 'colourSecondary': colors.logic },
          'loop_blocks': { 'colourPrimary': colors.loop, 'colourSecondary': colors.loop },
          'math_blocks': { 'colourPrimary': colors.math, 'colourSecondary': colors.math },
          'text_blocks': { 'colourPrimary': colors.text, 'colourSecondary': colors.text },
          'variable_blocks': { 'colourPrimary': colors.variable, 'colourSecondary': colors.variable },
          'procedure_blocks': { 'colourPrimary': colors.procedure, 'colourSecondary': colors.procedure },
          'control_blocks': { 'colourPrimary': colors.control, 'colourSecondary': colors.control },
          'action_blocks': { 'colourPrimary': colors.action, 'colourSecondary': colors.action },
          'sensor_blocks': { 'colourPrimary': colors.sensor, 'colourSecondary': colors.sensor },
          'system_blocks': { 'colourPrimary': colors.system, 'colourSecondary': colors.system }
        },
        'componentStyles': {
          'workspaceBackgroundColour': 'var(--color-ui-bg-paper, #1e1e2e)',
          'toolboxBackgroundColour': 'var(--color-surface, #191a24)',
          'toolboxForegroundColour': 'var(--color-on-surface, #cdd6f4)',
          'flyoutBackgroundColour': 'var(--color-surface-container-low, #1e1e2e)',
          'flyoutForegroundColour': 'var(--color-on-surface, #cdd6f4)',
          'scrollbarColour': '#6c7086',
          'scrollbarOpacity': 0.9,
          'insertionMarkerColour': colors.marker,
          'insertionMarkerOpacity': 0.2
        }
      });
      workspaceRef.current.setTheme(dynamicTheme)
    }
  }, [colorTheme])

  return (
    <div className="blockly-editor-container">
      <div ref={blocklyDivRef} className="blockly-editor-workspace" />
      
      {/* Custom floating controls to match sandbox tool styles */}
      <div className="blockly-editor__controls">
        <button
          className="blockly-editor__control-btn pixel-border btn-press"
          onClick={() => {
            if (workspaceRef.current) {
              workspaceRef.current.zoomToFit()
              workspaceRef.current.scrollCenter()
            }
          }}
          title="Recenter / Zoom to Fit"
        >
          <MaterialIcon icon="center_focus_strong" />
        </button>
        <button
          className="blockly-editor__control-btn pixel-border btn-press"
          onClick={() => {
            if (workspaceRef.current) {
              workspaceRef.current.zoomCenter(1)
            }
          }}
          title="Zoom In"
        >
          <MaterialIcon icon="zoom_in" />
        </button>
        <button
          className="blockly-editor__control-btn pixel-border btn-press"
          onClick={() => {
            if (workspaceRef.current) {
              workspaceRef.current.zoomCenter(-1)
            }
          }}
          title="Zoom Out"
        >
          <MaterialIcon icon="zoom_out" />
        </button>
        <button
          className="blockly-editor__control-btn blockly-editor__control-btn--danger pixel-border btn-press"
          onClick={() => {
            if (workspaceRef.current) {
              if (window.confirm("Are you sure you want to clear all blocks from the workspace?")) {
                workspaceRef.current.clear()
                Blockly.serialization.workspaces.load(CLEAN_WORKSPACE_STATE, workspaceRef.current)
                // Force code sync to game state
                const code = javascriptGenerator.workspaceToCode(workspaceRef.current)
                useGameStore.getState().setDroneScript(code)
                useGameStore.setState({ droneBlocklyWorkspace: CLEAN_WORKSPACE_STATE })
                
                // Recenter
                workspaceRef.current.zoomToFit()
                workspaceRef.current.scrollCenter()
              }
            }
          }}
          title="Clear Workspace"
        >
          <MaterialIcon icon="delete" />
        </button>
      </div>
    </div>
  )
}
