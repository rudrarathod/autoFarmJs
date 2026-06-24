import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

// ====================================================
// 0. C++ IDENTIFIER VALIDATORS
// ====================================================

/**
 * Validates a variable name to be a correct C++ identifier.
 * Rules:
 * 1. Only alphanumeric characters and underscores allowed.
 * 2. Cannot start with a digit.
 * 3. Cannot match C++ or system reserved keywords.
 */
export function validateVariableName(name) {
  if (!name) return null;
  
  // Remove any non-alphanumeric/non-underscore characters
  let cleaned = name.replace(/[^a-zA-Z0-9_]/g, '');
  
  // If it starts with a number, prepend an underscore
  if (/^[0-9]/.test(cleaned)) {
    cleaned = '_' + cleaned;
  }
  
  // Ensure it's not empty
  if (cleaned.length === 0) {
    cleaned = 'v';
  }
  
  // Check against reserved C++ keywords and API names
  const reserved = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return',
    'int', 'float', 'double', 'char', 'bool', 'boolean', 'String', 'string', 'auto', 'void',
    'const', 'class', 'struct', 'new', 'delete', 'true', 'false', 'null', 'nullptr',
    'drone', 'sensor', 'Serial', 'setup', 'loop', 'delay'
  ]);
  
  if (reserved.has(cleaned)) {
    cleaned = '_' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validates a function name to be a correct C++ identifier.
 */
export function validateFunctionName(name) {
  if (!name) return null;
  
  let cleaned = name.replace(/[^a-zA-Z0-9_]/g, '');
  
  if (/^[0-9]/.test(cleaned)) {
    cleaned = '_' + cleaned;
  }
  
  if (cleaned.length === 0) {
    cleaned = 'myFunction';
  }
  
  const reserved = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return',
    'int', 'float', 'double', 'char', 'bool', 'boolean', 'String', 'string', 'auto', 'void',
    'const', 'class', 'struct', 'new', 'delete', 'true', 'false', 'null', 'nullptr',
    'drone', 'sensor', 'Serial', 'setup', 'loop', 'delay'
  ]);
  
  if (reserved.has(cleaned)) {
    cleaned = '_' + cleaned;
  }
  
  return cleaned;
}

// ====================================================
// 1. CATEGORY 1 — SYSTEM
// ====================================================

// Program Structure - Setup
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

// Program Structure - Loop
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

// Timing - delay(ms)
Blockly.Blocks['time_delay'] = {
  init: function () {
    this.appendValueInput("MS")
      .setCheck("Number")
      .appendField("delay(");
    this.appendDummyInput()
      .appendField("ms);");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('system_blocks');
    this.setTooltip("Pauses program execution for specified milliseconds.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['time_delay'] = function (block, generator) {
  const ms = generator.valueToCode(block, 'MS', 0) || '1000';
  return `  delay(${ms});\n`;
}

// Legacy Alias for delay(ms)
Blockly.Blocks['drone_wait'] = {
  init: function () {
    this.appendValueInput("MS")
      .setCheck("Number")
      .appendField("delay(");
    this.appendDummyInput()
      .appendField("ms);");
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

// Program Control - return
Blockly.Blocks['system_return'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .appendField("return\u00A0");
    this.appendDummyInput()
      .appendField(";");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setStyle('system_blocks');
    this.setTooltip("Exits the current function and optionally returns a value.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['system_return'] = function (block, generator) {
  const val = generator.valueToCode(block, 'VALUE', 0);
  if (val) {
    return `  return ${val};\n`;
  }
  return `  return;\n`;
}

// ====================================================
// 2. CATEGORY 2 — DRONE
// ====================================================

// drone.till()
Blockly.Blocks['drone_till'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("drone.till();");
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

// drone.plant("crop")
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
      .appendField(");");
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

// drone.harvest()
Blockly.Blocks['drone_harvest'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("drone.harvest();");
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

// drone.moveNext()
Blockly.Blocks['drone_move_next'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("drone.moveNext();");
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

// drone.moveTo(row, col)
Blockly.Blocks['drone_move_to'] = {
  init: function () {
    this.appendValueInput("ROW")
      .setCheck("Number")
      .appendField("drone.moveTo(row:");
    this.appendValueInput("COL")
      .setCheck("Number")
      .appendField(", col:");
    this.appendDummyInput()
      .appendField(");");
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

// drone.charge()
Blockly.Blocks['drone_charge'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("drone.charge();");
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


// ====================================================
// 3. CATEGORY 3 — SENSORS
// ====================================================

// sensor.isTurf()
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

// sensor.isSoil()
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

// sensor.isGrowing()
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

// sensor.isRipe()
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

// sensor.isOre()
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

// sensor.getEnergy()
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

// sensor.position().row
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

// sensor.position().col
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

// sensor.gridSize()
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


// ====================================================
// 4. CATEGORY 4 — VARIABLES (STATICALLY TYPED)
// ====================================================

// Declare int
Blockly.Blocks['var_declare_int'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck("Number")
      .appendField("int\u00A0")
      .appendField(new Blockly.FieldVariable("x", null, ["int"], "int"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.appendDummyInput().appendField(";");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip("Declares a statically typed integer variable.");
  }
}
javascriptGenerator.forBlock['var_declare_int'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'VALUE', 0) || '0';
  return `  int ${varName} = ${value};\n`;
}

// Declare float
Blockly.Blocks['var_declare_float'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck("Number")
      .appendField("float\u00A0")
      .appendField(new Blockly.FieldVariable("y", null, ["float"], "float"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.appendDummyInput().appendField(";");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip("Declares a statically typed float variable.");
  }
}
javascriptGenerator.forBlock['var_declare_float'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'VALUE', 0) || '0.0';
  return `  float ${varName} = ${value};\n`;
}

// Declare bool
Blockly.Blocks['var_declare_bool'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck("Boolean")
      .appendField("bool\u00A0")
      .appendField(new Blockly.FieldVariable("flag", null, ["bool"], "bool"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.appendDummyInput().appendField(";");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip("Declares a statically typed boolean variable.");
  }
}
javascriptGenerator.forBlock['var_declare_bool'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'VALUE', 0) || 'false';
  return `  bool ${varName} = ${value};\n`;
}

// Declare String
Blockly.Blocks['var_declare_string'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck("String")
      .appendField("String\u00A0")
      .appendField(new Blockly.FieldVariable("str", null, ["String"], "String"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.appendDummyInput().appendField(";");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip("Declares a statically typed String variable.");
  }
}
javascriptGenerator.forBlock['var_declare_string'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'VALUE', 0) || '""';
  return `  String ${varName} = ${value};\n`;
}

// Variable Assignment (Type Safe, visual [var] = [value];)
Blockly.Blocks['var_set'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .appendField(new Blockly.FieldVariable("x", null, ["int", "float", "bool", "String"], "int"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.appendDummyInput().appendField(";");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip("Assigns a value to a variable.");
  },
  onchange: function(event) {
    if (!this.workspace || this.workspace.isFlyout) return;
    const varId = this.getFieldValue('VAR');
    const variable = this.workspace.getVariableById(varId);
    if (variable) {
      let checkType = null;
      if (variable.type === 'int' || variable.type === 'float') {
        checkType = 'Number';
      } else if (variable.type === 'bool') {
        checkType = 'Boolean';
      } else if (variable.type === 'String') {
        checkType = 'String';
      }
      this.getInput('VALUE').setCheck(checkType);
    }
  }
}
javascriptGenerator.forBlock['var_set'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'VALUE', 0) || '0';
  return `  ${varName} = ${value};\n`;
}

// Variable Reference (displays ONLY variable name)
Blockly.Blocks['variables_get'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('x', null, ['int', 'float', 'bool', 'String'], 'int'), 'VAR');
    this.setOutput(true);
    this.setStyle('variable_blocks');
    this.setTooltip('Returns the value of this variable.');
  },
  onchange: function(event) {
    if (!this.workspace || this.workspace.isFlyout) return;
    const varId = this.getFieldValue('VAR');
    const variable = this.workspace.getVariableById(varId);
    if (variable) {
      let checkType = null;
      if (variable.type === 'int' || variable.type === 'float') {
        checkType = 'Number';
      } else if (variable.type === 'bool') {
        checkType = 'Boolean';
      } else if (variable.type === 'String') {
        checkType = 'String';
      }
      this.outputConnection.setCheck(checkType);
    }
  }
};
javascriptGenerator.forBlock['variables_get'] = function(block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return [varName, 0];
};


// ====================================================
// 5. CATEGORY 5 — LOGIC
// ====================================================

// Simple If
Blockly.Blocks['controls_if_simple'] = {
  init: function () {
    this.appendValueInput("COND")
      .setCheck("Boolean")
      .appendField("if (\u00A0");
    this.appendDummyInput()
      .appendField("\u00A0) {");
    this.appendStatementInput("STACK")
      .setCheck(null);
    this.appendDummyInput()
      .appendField("}");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('logic_blocks');
    this.setTooltip("Executes blocks if condition is true.");
  }
}
javascriptGenerator.forBlock['controls_if_simple'] = function (block, generator) {
  const cond = generator.valueToCode(block, 'COND', 0) || 'false';
  const branch = generator.statementToCode(block, 'STACK');
  return `  if (${cond}) {\n${branch}  }\n`;
}

// If Else
Blockly.Blocks['controls_if_else'] = {
  init: function () {
    this.appendValueInput("COND")
      .setCheck("Boolean")
      .appendField("if (\u00A0");
    this.appendDummyInput()
      .appendField("\u00A0) {");
    this.appendStatementInput("STACK_IF")
      .setCheck(null);
    this.appendDummyInput()
      .appendField("} else {");
    this.appendStatementInput("STACK_ELSE")
      .setCheck(null);
    this.appendDummyInput()
      .appendField("}");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('logic_blocks');
    this.setTooltip("If condition is true, execute first block, otherwise execute else block.");
  }
}
javascriptGenerator.forBlock['controls_if_else'] = function (block, generator) {
  const cond = generator.valueToCode(block, 'COND', 0) || 'false';
  const branchIf = generator.statementToCode(block, 'STACK_IF');
  const branchElse = generator.statementToCode(block, 'STACK_ELSE');
  return `  if (${cond}) {\n${branchIf}  } else {\n${branchElse}  }\n`;
}

// Comparisons
Blockly.Blocks['logic_compare_cpp'] = {
  init: function() {
    this.appendValueInput('A');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['==', 'EQ'],
          ['!=', 'NEQ'],
          ['<', 'LT'],
          ['<=', 'LTE'],
          ['>', 'GT'],
          ['>=', 'GTE']
        ]), 'OP');
    this.appendValueInput('B');
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
    this.setTooltip('Compares two values using standard C++ operators.');
  }
};
javascriptGenerator.forBlock['logic_compare_cpp'] = function(block, generator) {
  const opMap = {
    'EQ': '==',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>='
  };
  const op = opMap[block.getFieldValue('OP')];
  const arg0 = generator.valueToCode(block, 'A', 0) || '0';
  const arg1 = generator.valueToCode(block, 'B', 0) || '0';
  return [`(${arg0} ${op} ${arg1})`, 0];
};

// Hook/Override standard logic_compare
javascriptGenerator.forBlock['logic_compare'] = function (block, generator) {
  const operator = block.getFieldValue('OP');
  let op = '==';
  if (operator === 'EQ') op = '==';
  else if (operator === 'NEQ') op = '!=';
  else if (operator === 'LT') op = '<';
  else if (operator === 'LTE') op = '<=';
  else if (operator === 'GT') op = '>';
  else if (operator === 'GTE') op = '>=';
  
  const argument0 = generator.valueToCode(block, 'A', 0) || '0';
  const argument1 = generator.valueToCode(block, 'B', 0) || '0';
  return [`(${argument0} ${op} ${argument1})`, 0];
}

// Boolean Logic (&&, ||)
Blockly.Blocks['logic_operation_cpp'] = {
  init: function() {
    this.appendValueInput('A').setCheck('Boolean');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['&&', 'AND'],
          ['||', 'OR']
        ]), 'OP');
    this.appendValueInput('B').setCheck('Boolean');
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
    this.setTooltip('Logical AND/OR.');
  }
};
javascriptGenerator.forBlock['logic_operation_cpp'] = function(block, generator) {
  const op = block.getFieldValue('OP') === 'AND' ? '&&' : '||';
  const arg0 = generator.valueToCode(block, 'A', 0) || 'false';
  const arg1 = generator.valueToCode(block, 'B', 0) || 'false';
  return [`(${arg0} ${op} ${arg1})`, 0];
};

// Hook standard logic_operation
javascriptGenerator.forBlock['logic_operation'] = function (block, generator) {
  const operator = block.getFieldValue('OP') === 'AND' ? '&&' : '||';
  const argument0 = generator.valueToCode(block, 'A', 0) || 'false';
  const argument1 = generator.valueToCode(block, 'B', 0) || 'false';
  return [`(${argument0} ${operator} ${argument1})`, 0];
}

// Negation (!)
Blockly.Blocks['logic_negate_cpp'] = {
  init: function() {
    this.appendValueInput('BOOL')
        .setCheck('Boolean')
        .appendField('!');
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
    this.setTooltip('Logical NOT.');
  }
};
javascriptGenerator.forBlock['logic_negate_cpp'] = function(block, generator) {
  const arg = generator.valueToCode(block, 'BOOL', 0) || 'false';
  return [`(!${arg})`, 0];
};

// Hook standard logic_negate
javascriptGenerator.forBlock['logic_negate'] = function (block, generator) {
  const argument0 = generator.valueToCode(block, 'BOOL', 0) || 'false';
  return [`(!${argument0})`, 0];
}

// Boolean Constants (true, false)
Blockly.Blocks['logic_boolean_cpp'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['true', 'TRUE'],
          ['false', 'FALSE']
        ]), 'BOOL');
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
    this.setTooltip('Boolean constant.');
  }
};
javascriptGenerator.forBlock['logic_boolean_cpp'] = function(block) {
  const code = block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false';
  return [code, 0];
};

// Hook standard logic_boolean
javascriptGenerator.forBlock['logic_boolean'] = function (block) {
  const code = block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false';
  return [code, 0];
}


// ====================================================
// 6. CATEGORY 6 — LOOPS
// ====================================================

// For Loop
Blockly.Blocks['controls_for_cpp'] = {
  init: function () {
    this.appendValueInput("START")
      .setCheck("Number")
      .appendField("for (int\u00A0")
      .appendField(new Blockly.FieldVariable("i", null, ["int"], "int"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.appendValueInput("END")
      .setCheck("Number")
      .appendField(";\u00A0")
      .appendField("i", "VAR_LABEL1")
      .appendField("\u00A0<=\u00A0");
    this.appendDummyInput()
      .appendField(";\u00A0")
      .appendField("i", "VAR_LABEL2")
      .appendField("++) {");
    this.appendStatementInput("STACK")
      .setCheck(null);
    this.appendDummyInput()
      .appendField("}");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('loop_blocks');
    this.setTooltip("A standard C++ for loop.");
  },
  onchange: function (event) {
    if (!this.workspace || this.workspace.isFlyout) return;
    const varField = this.getField('VAR');
    if (varField) {
      const varName = varField.getText();
      const label1 = this.getField('VAR_LABEL1');
      if (label1) label1.setValue(varName);
      const label2 = this.getField('VAR_LABEL2');
      if (label2) label2.setValue(varName);
    }
  }
}
javascriptGenerator.forBlock['controls_for_cpp'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const start = generator.valueToCode(block, 'START', 0) || '0';
  const end = generator.valueToCode(block, 'END', 0) || '0';
  const branch = generator.statementToCode(block, 'STACK');
  return `  for (int ${varName} = ${start}; ${varName} <= ${end}; ${varName}++) {\n${branch}  }\n`;
}

// While Loop
Blockly.Blocks['controls_while_cpp'] = {
  init: function () {
    this.appendValueInput("COND")
      .setCheck("Boolean")
      .appendField("while (\u00A0");
    this.appendDummyInput()
      .appendField("\u00A0) {");
    this.appendStatementInput("STACK")
      .setCheck(null);
    this.appendDummyInput()
      .appendField("}");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('loop_blocks');
    this.setTooltip("A standard C++ while loop.");
  }
}
javascriptGenerator.forBlock['controls_while_cpp'] = function (block, generator) {
  const cond = generator.valueToCode(block, 'COND', 0) || 'false';
  const branch = generator.statementToCode(block, 'STACK');
  return `  while (${cond}) {\n${branch}  }\n`;
}

// Loop Control (break, continue)
Blockly.Blocks['loop_control'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['break', 'BREAK'],
          ['continue', 'CONTINUE']
        ]), 'ACTION')
        .appendField(';');
    this.setPreviousStatement(true, null);
    this.setStyle('loop_blocks');
    this.setTooltip('Break out of the loop or continue to next iteration.');
  }
};
javascriptGenerator.forBlock['loop_control'] = function(block) {
  const action = block.getFieldValue('ACTION') === 'BREAK' ? 'break;' : 'continue;';
  return `  ${action}\n`;
};


// ====================================================
// 7. CATEGORY 7 — FUNCTIONS
// ====================================================

// Attach validators to standard Blockly procedures
const origDefNoReturn = Blockly.Blocks['procedures_defnoreturn'];
if (origDefNoReturn) {
  const origInit = origDefNoReturn.init;
  origDefNoReturn.init = function() {
    origInit.call(this);
    const nameField = this.getField('NAME');
    if (nameField) {
      nameField.setValidator(validateFunctionName);
    }
  };
}

const origDefReturn = Blockly.Blocks['procedures_defreturn'];
if (origDefReturn) {
  const origInit = origDefReturn.init;
  origDefReturn.init = function() {
    origInit.call(this);
    const nameField = this.getField('NAME');
    if (nameField) {
      nameField.setValidator(validateFunctionName);
    }
  };
}

// Generate C++ void functions (procedures_defnoreturn)
javascriptGenerator.forBlock['procedures_defnoreturn'] = function (block, generator) {
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  const branch = generator.statementToCode(block, 'STACK');
  
  // Collect parameters (statically typed to int in C++)
  const args = [];
  const variables = block.getVars() || [];
  for (let i = 0; i < variables.length; i++) {
    args.push('int ' + generator.getVariableName(variables[i]));
  }
  const argsStr = args.join(', ');
  
  return `void ${funcName}(${argsStr}) {\n${branch}}\n\n`;
}

// Generate C++ auto functions (procedures_defreturn)
javascriptGenerator.forBlock['procedures_defreturn'] = function (block, generator) {
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  const branch = generator.statementToCode(block, 'STACK');
  let returnValue = generator.valueToCode(block, 'RETURN', 0) || '';
  if (returnValue) {
    returnValue = `  return ${returnValue};\n`;
  }
  
  // Collect parameters (statically typed to int in C++)
  const args = [];
  const variables = block.getVars() || [];
  for (let i = 0; i < variables.length; i++) {
    args.push('int ' + generator.getVariableName(variables[i]));
  }
  const argsStr = args.join(', ');
  
  return `auto ${funcName}(${argsStr}) {\n${branch}${returnValue}}\n\n`;
}

// Function Call (No Return)
javascriptGenerator.forBlock['procedures_callnoreturn'] = function (block, generator) {
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  const args = [];
  const variables = block.getVars() || [];
  for (let i = 0; i < variables.length; i++) {
    args.push(generator.valueToCode(block, 'ARG' + i, 0) || '0');
  }
  const argsStr = args.join(', ');
  return `  ${funcName}(${argsStr});\n`;
}

// Function Call (With Return)
javascriptGenerator.forBlock['procedures_callreturn'] = function (block, generator) {
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  const args = [];
  const variables = block.getVars() || [];
  for (let i = 0; i < variables.length; i++) {
    args.push(generator.valueToCode(block, 'ARG' + i, 0) || '0');
  }
  const argsStr = args.join(', ');
  return [`${funcName}(${argsStr})`, 0];
}

// Custom procedures_return statement block
Blockly.Blocks['procedures_return'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .appendField("return\u00A0");
    this.appendDummyInput().appendField(";");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setStyle('procedure_blocks');
    this.setTooltip("Returns a value from a function.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['procedures_return'] = function (block, generator) {
  const value = generator.valueToCode(block, 'VALUE', 0);
  if (value) {
    return `  return ${value};\n`;
  }
  return `  return;\n`;
}


// ====================================================
// 8. CATEGORY 8 — CONSTANTS
// ====================================================

// Crop constant species dropdown block
Blockly.Blocks['crop_species'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ["wheat", "wheat"],
        ["carrot", "carrot"],
        ["beetroot", "beetroot"],
        ["potato", "potato"],
        ["watermelon", "watermelon"],
        ["grass", "grass"]
      ]), "CROP");
    this.setOutput(true, "String");
    this.setStyle('text_blocks');
    this.setTooltip("Returns selected crop type value.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['crop_species'] = function (block) {
  const crop = block.getFieldValue('CROP');
  return [`"${crop}"`, 0];
}

// Tile constant type dropdown block
Blockly.Blocks['tile_type_constant'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ["TURF", "turf"],
        ["SOIL", "soil"],
        ["GROWING", "growing"],
        ["RIPE", "ripe"],
        ["ORE", "ore"]
      ]), "TYPE");
    this.setOutput(true, "String");
    this.setStyle('text_blocks');
    this.setTooltip("Returns selected tile type constant.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['tile_type_constant'] = function (block) {
  const type = block.getFieldValue('TYPE');
  return [`"${type}"`, 0];
}

// Preserve legacy tile_type block
Blockly.Blocks['tile_type'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ["turf", "turf"],
        ["soil", "soil"],
        ["seedling", "seedling"],
        ["growing", "growing"],
        ["ripe", "ripe"],
        ["copper_ore", "copper_ore"],
        ["iron_ore", "iron_ore"],
        ["crystal_ore", "crystal_ore"],
        ["charging_station", "charging_station"]
      ]), "TYPE");
    this.setOutput(true, "String");
    this.setStyle('text_blocks');
    this.setTooltip("Returns selected tile type value.");
    this.setHelpUrl("");
  }
}
javascriptGenerator.forBlock['tile_type'] = function (block) {
  const type = block.getFieldValue('TYPE');
  return [`"${type}"`, 0];
}

// Custom Number Constant
Blockly.Blocks['number_constant_cpp'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0), 'NUM');
    this.setOutput(true, 'Number');
    this.setStyle('math_blocks');
    this.setTooltip('A number literal.');
  }
};
javascriptGenerator.forBlock['number_constant_cpp'] = function(block) {
  const num = block.getFieldValue('NUM');
  return [String(num), 0];
};

// Hook standard math_number
javascriptGenerator.forBlock['math_number'] = function (block) {
  const num = block.getFieldValue('NUM');
  return [String(num), 0];
}

// Custom String Constant
Blockly.Blocks['string_constant_cpp'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('"')
        .appendField(new Blockly.FieldTextInput(''), 'TEXT')
        .appendField('"');
    this.setOutput(true, 'String');
    this.setStyle('text_blocks');
    this.setTooltip('A string literal.');
  }
};
javascriptGenerator.forBlock['string_constant_cpp'] = function(block) {
  const text = block.getFieldValue('TEXT') || '';
  const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return [`"${escaped}"`, 0];
};

// Hook standard text block
javascriptGenerator.forBlock['text'] = function (block) {
  const textValue = block.getFieldValue('TEXT') || ''
  const escaped = textValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return [`"${escaped}"`, 0]
}


// ====================================================
// 9. CATEGORY 9 — OPERATORS
// ====================================================

// Arithmetic Operators (+ - * / %)
Blockly.Blocks['operator_arithmetic_cpp'] = {
  init: function() {
    this.appendValueInput('A').setCheck('Number');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['+', 'ADD'],
          ['-', 'MINUS'],
          ['*', 'MULTIPLY'],
          ['/', 'DIVIDE'],
          ['%', 'MODULO']
        ]), 'OP');
    this.appendValueInput('B').setCheck('Number');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setStyle('math_blocks');
    this.setTooltip('Arithmetic operations (+ - * / %).');
  }
};
javascriptGenerator.forBlock['operator_arithmetic_cpp'] = function(block, generator) {
  const opMap = {
    'ADD': '+',
    'MINUS': '-',
    'MULTIPLY': '*',
    'DIVIDE': '/',
    'MODULO': '%'
  };
  const op = opMap[block.getFieldValue('OP')];
  const arg0 = generator.valueToCode(block, 'A', 0) || '0';
  const arg1 = generator.valueToCode(block, 'B', 0) || '0';
  return [`(${arg0} ${op} ${arg1})`, 0];
};

// Hook standard math_arithmetic
javascriptGenerator.forBlock['math_arithmetic'] = function (block, generator) {
  const operator = block.getFieldValue('OP');
  let op = '+';
  if (operator === 'ADD') op = '+';
  else if (operator === 'MINUS') op = '-';
  else if (operator === 'MULTIPLY') op = '*';
  else if (operator === 'DIVIDE') op = '/';
  else if (operator === 'MODULO') op = '%';
  
  const argument0 = generator.valueToCode(block, 'A', 0) || '0';
  const argument1 = generator.valueToCode(block, 'B', 0) || '0';
  return [`(${argument0} ${op} ${argument1})`, 0];
}

// Increment/Decrement (i++, i--)
Blockly.Blocks['operator_inc_dec_cpp'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('i', null, ['int', 'float'], 'int'), 'VAR')
        .appendField(new Blockly.FieldDropdown([
          ['++', 'INC'],
          ['--', 'DEC']
        ]), 'OP')
        .appendField(';');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Increments or decrements a variable.');
  }
};
javascriptGenerator.forBlock['operator_inc_dec_cpp'] = function(block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const op = block.getFieldValue('OP') === 'INC' ? '++' : '--';
  return `  ${varName}${op};\n`;
};

// Compound Assignment (+= -= *= /=)
Blockly.Blocks['operator_compound_cpp'] = {
  init: function() {
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField(new Blockly.FieldVariable('x', null, ['int', 'float'], 'int'), 'VAR')
        .appendField(new Blockly.FieldDropdown([
          ['+=', 'ADD_ASSIGN'],
          ['-=', 'SUB_ASSIGN'],
          ['*=', 'MUL_ASSIGN'],
          ['/=', 'DIV_ASSIGN']
        ]), 'OP');
    this.appendDummyInput().appendField(";");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Compound assignment to a variable.');
  }
};
javascriptGenerator.forBlock['operator_compound_cpp'] = function(block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const opMap = {
    'ADD_ASSIGN': '+=',
    'SUB_ASSIGN': '-=',
    'MUL_ASSIGN': '*=',
    'DIV_ASSIGN': '/='
  };
  const op = opMap[block.getFieldValue('OP')];
  const value = generator.valueToCode(block, 'VALUE', 0) || '0';
  return `  ${varName} ${op} ${value};\n`;
};


// ====================================================
// 10. CATEGORY 10 — DEBUG
// ====================================================

// Serial Print / Serial Println
Blockly.Blocks['serial_debug_cpp'] = {
  init: function() {
    this.appendValueInput('VALUE')
        .appendField('Serial.')
        .appendField(new Blockly.FieldDropdown([
          ['println', 'PRINTLN'],
          ['print', 'PRINT']
        ]), 'MODE')
        .appendField('(');
    this.appendDummyInput().appendField(');');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('system_blocks');
    this.setTooltip('Prints a value to the serial monitor (with or without newline).');
  }
};
javascriptGenerator.forBlock['serial_debug_cpp'] = function(block, generator) {
  const mode = block.getFieldValue('MODE') === 'PRINTLN' ? 'println' : 'print';
  const val = generator.valueToCode(block, 'VALUE', 0) || '""';
  return `  Serial.${mode}(${val});\n`;
};

// Preserve legacy serial_print block
Blockly.Blocks['serial_print'] = {
  init: function () {
    this.appendValueInput("MSG")
      .setCheck(null)
      .appendField("Serial.println(");
    this.appendDummyInput()
      .appendField(");");
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


// ====================================================
// 11. GENERAL GENERATOR HOOKS & OVERRIDES
// ====================================================

// Custom finish implementation to strip automatic 'var' declarations
// and only output direct C++ code matching the user's workspace blocks
javascriptGenerator.finish = function (code) {
  const definitions = [];
  for (const name in this.definitions_) {
    const def = this.definitions_[name];
    // Filter out standard javascript 'var' declarations
    if (!def.startsWith('var ')) {
      definitions.push(def);
    }
  }
  
  this.nameDB_.reset();
  const defsCode = definitions.length > 0 ? definitions.join('\n\n') + '\n\n' : '';
  return defsCode + code;
}
