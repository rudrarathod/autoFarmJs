import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

// ====================================================
// 1. SETUP AND LOOP BLOCKS
// ====================================================
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

// ====================================================
// 2. DRONE ACTIONS (EXISTING & NEW)
// ====================================================

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

// Removed magic blocks drone_go_home_charge and drone_move_relative

// ====================================================
// 3. SENSOR BLOCKS (READS DATA)
// ====================================================

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

// ====================================================
// 4. CONTROL FLOW & SAFETY (EXISTING & NEW)
// ====================================================

// Removed magic blocks safety_charge and loop_grid

// ====================================================
// 5. SYSTEM & CONSTANTS (EXISTING & NEW)
// ====================================================

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

// NEW: Crop constant dropdown block (returns crop string value)
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

// NEW: Tile type constant dropdown block (returns tile string value)
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

// ====================================================
// Custom Typed Variables, Logic, and Functions
// ====================================================

Blockly.Blocks['var_declare_int'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck("Number")
      .appendField("int\u00A0")
      .appendField(new Blockly.FieldVariable("x"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip("Declares an integer variable.");
  }
}
javascriptGenerator.forBlock['var_declare_int'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'VALUE', 0) || '0';
  return `  int ${varName} = ${value};\n`;
}

Blockly.Blocks['var_declare_float'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck("Number")
      .appendField("float\u00A0")
      .appendField(new Blockly.FieldVariable("y"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip("Declares a float variable.");
  }
}
javascriptGenerator.forBlock['var_declare_float'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'VALUE', 0) || '0.0';
  return `  float ${varName} = ${value};\n`;
}

Blockly.Blocks['var_declare_bool'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck("Boolean")
      .appendField("bool\u00A0")
      .appendField(new Blockly.FieldVariable("flag"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip("Declares a boolean variable.");
  }
}
javascriptGenerator.forBlock['var_declare_bool'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'VALUE', 0) || 'false';
  return `  bool ${varName} = ${value};\n`;
}

Blockly.Blocks['var_declare_string'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck("String")
      .appendField("String\u00A0")
      .appendField(new Blockly.FieldVariable("str"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip("Declares a String variable.");
  }
}
javascriptGenerator.forBlock['var_declare_string'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'VALUE', 0) || '""';
  return `  String ${varName} = ${value};\n`;
}

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

Blockly.Blocks['controls_for_cpp'] = {
  init: function () {
    this.appendValueInput("START")
      .setCheck("Number")
      .appendField("for (int\u00A0")
      .appendField(new Blockly.FieldVariable("i"), "VAR")
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

Blockly.Blocks['var_set'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .appendField(new Blockly.FieldVariable("x"), "VAR")
      .appendField("\u00A0=\u00A0");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip("Assigns a value to a variable.");
  }
}
javascriptGenerator.forBlock['var_set'] = function (block, generator) {
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'VALUE', 0) || '0';
  return `  ${varName} = ${value};\n`;
}

Blockly.Blocks['procedures_return'] = {
  init: function () {
    this.appendValueInput("VALUE")
      .appendField("return\u00A0");
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
// 6. GENERAL GENERATOR HOOKS & OVERRIDES
// ====================================================

// Force comparison operators to C++ standard (== / != instead of === / !==)
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
  const code = `${argument0} ${op} ${argument1}`;
  return [code, 0];
}

// Override function definitions to generate C++ void/auto functions
javascriptGenerator.forBlock['procedures_defnoreturn'] = function (block, generator) {
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  const branch = generator.statementToCode(block, 'STACK');
  
  // Get variables (parameters)
  const args = [];
  const variables = block.getVars() || [];
  for (let i = 0; i < variables.length; i++) {
    args.push('int ' + generator.getVariableName(variables[i]));
  }
  const argsStr = args.join(', ');
  
  return `void ${funcName}(${argsStr}) {\n${branch}}\n\n`;
}

javascriptGenerator.forBlock['procedures_defreturn'] = function (block, generator) {
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  const branch = generator.statementToCode(block, 'STACK');
  let returnValue = generator.valueToCode(block, 'RETURN', 0) || '';
  if (returnValue) {
    returnValue = `  return ${returnValue};\n`;
  }
  
  // Get variables (parameters)
  const args = [];
  const variables = block.getVars() || [];
  for (let i = 0; i < variables.length; i++) {
    args.push('int ' + generator.getVariableName(variables[i]));
  }
  const argsStr = args.join(', ');
  
  return `auto ${funcName}(${argsStr}) {\n${branch}${returnValue}}\n\n`;
}

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
