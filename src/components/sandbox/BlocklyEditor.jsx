import { useEffect, useRef } from 'react'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import { useGameStore } from '../../store/gameStore.js'
import './BlocklyEditor.css'

// ----------------------------------------------------
// 1. CUSTOM FLAT RENDERER (RETRO PIXEL EDGES)
// ----------------------------------------------------
class RetroConstantProvider extends Blockly.blockRendering.ConstantProvider {
  constructor() {
    super()
    // Must be set BEFORE super.init() so derived shapes (INSIDE_CORNERS,
    // OUTSIDE_CORNERS) are built with 0-radius — the root cause of misalignment.
    this.CORNER_RADIUS = 0
    // Tighten internal spacing so blocks fit flush inside C-shape mouths
    this.MEDIUM_PADDING = 2
    this.LARGE_PADDING = 2
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

// ----------------------------------------------------
// 2. CUSTOM BLOCK DEFINITIONS & GENERATOR CODE
// ----------------------------------------------------

// Setup and Loop blocks
Blockly.Blocks['arduino_setup'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("void setup()");
    this.appendStatementInput("STACK")
      .setCheck(null);
    this.setNextStatement(true, null); 
    this.setStyle('control_blocks');
    this.setTooltip("Runs once at the start of the script.");
    this.setHelpUrl("");
    this.setDeletable(false);
  }
}

javascriptGenerator.forBlock['arduino_setup'] = function (block, generator) {
  const branch = generator.statementToCode(block, 'STACK');
  return 'void setup() {\n' + branch + '}\n\n';
}

Blockly.Blocks['arduino_loop'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("void loop()");
    this.appendStatementInput("STACK")
      .setCheck(null);
    this.setPreviousStatement(true, null);
    this.setStyle('control_blocks');
    this.setTooltip("Runs repeatedly after setup() finishes.");
    this.setHelpUrl("");
    this.setDeletable(false);
  }
}

javascriptGenerator.forBlock['arduino_loop'] = function (block, generator) {
  const branch = generator.statementToCode(block, 'STACK');
  return 'void loop() {\n' + branch + '}\n\n';
}

// Drone Actions
Blockly.Blocks['drone_till'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("drone.till()");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('action_blocks');
    this.setTooltip("Tills turf at current tile into soil.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['drone_till'] = function () {
  return '  drone.till();\n';
}

Blockly.Blocks['drone_plant'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("drone.plant(")
      .appendField(new Blockly.FieldDropdown([
        ["wheat", "wheat"],
        ["carrot", "carrot"],
        ["beetroot", "beetroot"],
        ["potato", "potato"],
        ["watermelon", "watermelon"],
        ["grass", "grass"]
      ]), "CROP")
      .appendField(")");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('action_blocks');
    this.setTooltip("Plants selected crop on tilled soil.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['drone_plant'] = function (block) {
  const crop = block.getFieldValue('CROP');
  return `  drone.plant("${crop}");\n`;
}

Blockly.Blocks['drone_harvest'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("drone.harvest()");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('action_blocks');
    this.setTooltip("Harvests ripe crop or mines ore at current tile.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['drone_harvest'] = function () {
  return '  drone.harvest();\n';
}

Blockly.Blocks['drone_move_next'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("drone.moveNext()");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('action_blocks');
    this.setTooltip("Moves drone to next tile (wrap around).");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['drone_move_next'] = function () {
  return '  drone.moveNext();\n';
}

Blockly.Blocks['drone_move_to'] = {
  init: function () {
    this.appendValueInput("ROW")
      .setCheck("Number")
      .appendField("drone.moveTo(row:");
    this.appendValueInput("COL")
      .setCheck("Number")
      .appendField(", col:");
    this.appendDummyInput()
      .appendField(")");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('action_blocks');
    this.setTooltip("Moves drone to specified coordinates.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['drone_move_to'] = function (block, generator) {
  const row = generator.valueToCode(block, 'ROW', 0) || '0';
  const col = generator.valueToCode(block, 'COL', 0) || '0';
  return `  drone.moveTo(${row}, ${col});\n`;
}

Blockly.Blocks['drone_charge'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("drone.charge()");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('action_blocks');
    this.setTooltip("Fully recharges energy. Must be at base (0,0).");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['drone_charge'] = function () {
  return '  drone.charge();\n';
}

Blockly.Blocks['drone_wait'] = {
  init: function () {
    this.appendValueInput("MS")
      .setCheck("Number")
      .appendField("delay(");
    this.appendDummyInput()
      .appendField("ms)");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('action_blocks');
    this.setTooltip("Pauses drone for specified duration.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['drone_wait'] = function (block, generator) {
  const ms = generator.valueToCode(block, 'MS', 0) || '1000';
  return `  delay(${ms});\n`;
}

// Sensor blocks (returns values)
Blockly.Blocks['sensor_is_ripe'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("sensor.isRipe()");
    this.setOutput(true, "Boolean");
    this.setStyle('sensor_blocks');
    this.setTooltip("Returns true if crop at current tile is ripe.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['sensor_is_ripe'] = function () {
  return ['sensor.isRipe()', 0];
}

Blockly.Blocks['sensor_is_soil'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("sensor.isSoil()");
    this.setOutput(true, "Boolean");
    this.setStyle('sensor_blocks');
    this.setTooltip("Returns true if current tile is tilled soil.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['sensor_is_soil'] = function () {
  return ['sensor.isSoil()', 0];
}

Blockly.Blocks['sensor_is_turf'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("sensor.isTurf()");
    this.setOutput(true, "Boolean");
    this.setStyle('sensor_blocks');
    this.setTooltip("Returns true if current tile is wild turf.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['sensor_is_turf'] = function () {
  return ['sensor.isTurf()', 0];
}

Blockly.Blocks['sensor_is_ore'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("sensor.isOre()");
    this.setOutput(true, "Boolean");
    this.setStyle('sensor_blocks');
    this.setTooltip("Returns true if current tile contains ore.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['sensor_is_ore'] = function () {
  return ['sensor.isOre()', 0];
}

Blockly.Blocks['sensor_is_growing'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("sensor.isGrowing()");
    this.setOutput(true, "Boolean");
    this.setStyle('sensor_blocks');
    this.setTooltip("Returns true if current tile is seedling or growing.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['sensor_is_growing'] = function () {
  return ['sensor.isGrowing()', 0];
}

Blockly.Blocks['sensor_get_energy'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("sensor.getEnergy()");
    this.setOutput(true, "Number");
    this.setStyle('sensor_blocks');
    this.setTooltip("Returns drone energy (0 - 100).");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['sensor_get_energy'] = function () {
  return ['sensor.getEnergy()', 0];
}

Blockly.Blocks['sensor_grid_size'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("sensor.gridSize()");
    this.setOutput(true, "Number");
    this.setStyle('sensor_blocks');
    this.setTooltip("Returns size of active farming grid.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['sensor_grid_size'] = function () {
  return ['sensor.gridSize()', 0];
}

Blockly.Blocks['sensor_position_row'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("sensor.position().row");
    this.setOutput(true, "Number");
    this.setStyle('sensor_blocks');
    this.setTooltip("Returns drone's current row index.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['sensor_position_row'] = function () {
  return ['sensor.position().row', 0];
}

Blockly.Blocks['sensor_position_col'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("sensor.position().col");
    this.setOutput(true, "Number");
    this.setStyle('sensor_blocks');
    this.setTooltip("Returns drone's current column index.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['sensor_position_col'] = function () {
  return ['sensor.position().col', 0];
}

// System block
Blockly.Blocks['serial_print'] = {
  init: function () {
    this.appendValueInput("MSG")
      .setCheck(null)
      .appendField("Serial.println(");
    this.appendDummyInput()
      .appendField(")");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('system_blocks');
    this.setTooltip("Prints a message or value to the console.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['serial_print'] = function (block, generator) {
  const msg = generator.valueToCode(block, 'MSG', 0) || '"message"';
  return `  Serial.println(${msg});\n`;
}

// ----------------------------------------------------
// 3. OVERRIDE STRING LITERALS & VAR TYPE FOR C++
// ----------------------------------------------------

// Force double quotes for text block in C++ code output
javascriptGenerator.forBlock['text'] = function (block) {
  const textValue = block.getFieldValue('TEXT') || ''
  const escaped = textValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return [`"${escaped}"`, 0]
}

// Override generator.finish to replace 'var ' declarations with 'int ' type for C++ Arduino conformity
const oldFinish = javascriptGenerator.finish
javascriptGenerator.finish = function (code) {
  let finishedCode = oldFinish.call(this, code)
  finishedCode = finishedCode.replace(/\bvar\s+(\w+);/g, 'int $1;')
  return finishedCode
}

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

// ----------------------------------------------------
// 5. DYNAMIC TOOLBOX GENERATION
// ----------------------------------------------------
function getToolboxConfig(unlockedNodes) {
  const isUnlocked = (nodeId) => unlockedNodes?.includes(nodeId) || false;

  const categories = [];

  // Category 1: Drone Actions
  const actionBlocks = [
    { "kind": "block", "type": "drone_charge" },
    {
      "kind": "block",
      "type": "drone_wait",
      "inputs": {
        "MS": {
          "block": {
            "type": "math_number",
            "fields": { "NUM": 1000 }
          }
        }
      }
    }
  ];

  if (isUnlocked('movement')) {
    actionBlocks.push({ "kind": "block", "type": "drone_move_next" });
    actionBlocks.push({
      "kind": "block",
      "type": "drone_move_to",
      "inputs": {
        "ROW": {
          "block": {
            "type": "math_number",
            "fields": { "NUM": 0 }
          }
        },
        "COL": {
          "block": {
            "type": "math_number",
            "fields": { "NUM": 0 }
          }
        }
      }
    });
  }

  if (isUnlocked('farmingActions')) {
    actionBlocks.push({ "kind": "block", "type": "drone_till" });
    actionBlocks.push({
      "kind": "block",
      "type": "drone_plant",
      "fields": { "CROP": "wheat" }
    });
    actionBlocks.push({ "kind": "block", "type": "drone_harvest" });
  }

  categories.push({
    "kind": "category",
    "name": "🚁 Actions",
    "colour": "160",
    "contents": actionBlocks
  });

  // Category 2: Sensors
  if (isUnlocked('sensors')) {
    categories.push({
      "kind": "category",
      "name": "📡 Sensors",
      "colour": "210",
      "contents": [
        { "kind": "block", "type": "sensor_is_ripe" },
        { "kind": "block", "type": "sensor_is_soil" },
        { "kind": "block", "type": "sensor_is_turf" },
        { "kind": "block", "type": "sensor_is_ore" },
        { "kind": "block", "type": "sensor_is_growing" },
        { "kind": "block", "type": "sensor_get_energy" },
        { "kind": "block", "type": "sensor_grid_size" },
        { "kind": "block", "type": "sensor_position_row" },
        { "kind": "block", "type": "sensor_position_col" }
      ]
    });
  }

  // Category 3: Control Flow
  const controlBlocks = [];
  if (isUnlocked('ifStatements')) {
    controlBlocks.push({ "kind": "block", "type": "controls_if" });
  }
  if (isUnlocked('loops')) {
    controlBlocks.push({
      "kind": "block",
      "type": "controls_repeat_ext",
      "inputs": {
        "TIMES": {
          "block": {
            "type": "math_number",
            "fields": { "NUM": 5 }
          }
        }
      }
    });
  }
  if (isUnlocked('forLoops')) {
    controlBlocks.push({ "kind": "block", "type": "controls_for" });
  }
  if (isUnlocked('whileLoops')) {
    controlBlocks.push({ "kind": "block", "type": "controls_whileUntil" });
  }

  if (controlBlocks.length > 0) {
    categories.push({
      "kind": "category",
      "name": "🎛️ Control",
      "colour": "120",
      "contents": controlBlocks
    });
  }

  // Category 4: Logic & Math
  const utilityBlocks = [];
  if (isUnlocked('ifStatements') || isUnlocked('loops') || isUnlocked('whileLoops')) {
    utilityBlocks.push({ "kind": "block", "type": "logic_compare" });
    utilityBlocks.push({ "kind": "block", "type": "logic_operation" });
    utilityBlocks.push({ "kind": "block", "type": "logic_negate" });
    utilityBlocks.push({ "kind": "block", "type": "logic_boolean" });
  }
  utilityBlocks.push({ "kind": "block", "type": "math_number" });
  utilityBlocks.push({ "kind": "block", "type": "math_arithmetic" });
  utilityBlocks.push({ "kind": "block", "type": "text" });

  categories.push({
    "kind": "category",
    "name": "🧮 Logic & Math",
    "colour": "230",
    "contents": utilityBlocks
  });

  // Category 5: Variables
  if (isUnlocked('variables') || isUnlocked('basicVariables') || isUnlocked('advancedVariables')) {
    categories.push({
      "kind": "category",
      "name": "📦 Variables",
      "colour": "330",
      "custom": "VARIABLE"
    });
  }

  // Category 6: Functions
  if (isUnlocked('functions')) {
    categories.push({
      "kind": "category",
      "name": "⚙️ Functions",
      "colour": "290",
      "custom": "PROCEDURE"
    });
  }

  // Category 7: System Logging
  categories.push({
    "kind": "category",
    "name": "📟 System",
    "colour": "190",
    "contents": [
      {
        "kind": "block",
        "type": "serial_print",
        "inputs": {
          "MSG": {
            "block": {
              "type": "text",
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

// Custom theme for Blockly matching cozy retro solar-punk/dark aesthetics
const theme = Blockly.Theme.defineTheme('ruralDark', {
  'base': Blockly.Themes.Classic,
  'blockStyles': {
    'logic_blocks': {
      'colourPrimary': '#f9e2af',
      'colourSecondary': '#f9e2af'
    },
    'loop_blocks': {
      'colourPrimary': '#cba6f7',
      'colourSecondary': '#cba6f7'
    },
    'math_blocks': {
      'colourPrimary': '#f9e2af',
      'colourSecondary': '#f9e2af'
    },
    'text_blocks': {
      'colourPrimary': '#a6e3a1',
      'colourSecondary': '#a6e3a1'
    },
    'variable_blocks': {
      'colourPrimary': '#fab387',
      'colourSecondary': '#fab387'
    },
    'procedure_blocks': {
      'colourPrimary': '#f38ba8',
      'colourSecondary': '#f38ba8'
    },
    'control_blocks': {
      'colourPrimary': '#cba6f7',
      'colourSecondary': '#cba6f7'
    },
    'action_blocks': {
      'colourPrimary': '#a6e3a1',
      'colourSecondary': '#a6e3a1'
    },
    'sensor_blocks': {
      'colourPrimary': '#89dceb',
      'colourSecondary': '#89dceb'
    },
    'system_blocks': {
      'colourPrimary': '#eba0ac',
      'colourSecondary': '#eba0ac'
    }
  },
  'componentStyles': {
    'workspaceBackgroundColour': '#1e1e2e',
    'toolboxBackgroundColour': '#191a24',
    'toolboxForegroundColour': '#cdd6f4',
    'flyoutBackgroundColour': '#1e1e2e',
    'flyoutForegroundColour': '#cdd6f4',
    'scrollbarColour': '#313244',
    'scrollbarOpacity': 0.6,
    'insertionMarkerColour': '#a6e3a1',
    'insertionMarkerOpacity': 0.2
  }
});

export default function BlocklyEditor() {
  const blocklyDivRef = useRef(null)
  const workspaceRef = useRef(null)

  const unlockedNodes = useGameStore((s) => s.unlockedNodes)
  const droneBlocklyWorkspace = useGameStore((s) => s.droneBlocklyWorkspace)

  // Initialize Blockly Workspace
  useEffect(() => {
    if (!blocklyDivRef.current) return

    // Inject Blockly
    const workspace = Blockly.inject(blocklyDivRef.current, {
      toolbox: getToolboxConfig(unlockedNodes),
      theme: theme,
      renderer: RENDERER_NAME, // Custom flat pixelated block renderer
      grid: {
        spacing: 20,
        length: 3,
        colour: '#2c313c',
        snap: true
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
      },
      trashcan: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: false
      }
    })

    workspaceRef.current = workspace

    // Load initial workspace state
    try {
      const stateToLoad = droneBlocklyWorkspace || DEFAULT_WORKSPACE_STATE
      Blockly.serialization.workspaces.load(stateToLoad, workspace)
    } catch (err) {
      console.error('Failed to load Blockly workspace state:', err)
      Blockly.serialization.workspaces.load(DEFAULT_WORKSPACE_STATE, workspace)
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

    workspace.addChangeListener(handleWorkspaceChange)

    // Handle resizing
    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(workspace)
    })
    if (blocklyDivRef.current.parentNode) {
      resizeObserver.observe(blocklyDivRef.current.parentNode)
    }

    return () => {
      workspace.removeChangeListener(handleWorkspaceChange)
      resizeObserver.disconnect()
      workspace.dispose()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update toolbox configuration dynamically when skills unlock
  useEffect(() => {
    if (workspaceRef.current) {
      const newToolbox = getToolboxConfig(unlockedNodes)
      workspaceRef.current.updateToolbox(newToolbox)
    }
  }, [unlockedNodes])

  return (
    <div className="blockly-editor-container">
      <div ref={blocklyDivRef} className="blockly-editor-workspace" />
    </div>
  )
}
