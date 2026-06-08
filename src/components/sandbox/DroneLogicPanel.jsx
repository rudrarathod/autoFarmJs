import { useEffect, useRef, useCallback, useState } from 'react'
import Editor from '@monaco-editor/react'
import './DroneLogicPanel.css'
import MaterialIcon from '../common/MaterialIcon.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { createDroneRunner } from '../../engine/DroneInterpreter.js'

/**
 * Interactive code editor panel for drone logic scripting.
 * Uses Monaco Editor (VS Code engine) for real syntax highlighting,
 * autocomplete, and error detection.
 */
export default function DroneLogicPanel() {
  const droneScript = useGameStore((s) => s.droneScript)
  const droneStatus = useGameStore((s) => s.droneStatus)
  const droneConsole = useGameStore((s) => s.droneConsole)
  const droneSpeedMultiplier = useGameStore((s) => s.droneSpeedMultiplier || 1.0)
  const setDroneScript = useGameStore((s) => s.setDroneScript)
  const setDroneSpeedMultiplier = useGameStore((s) => s.setDroneSpeedMultiplier)

  const [activeTab, setActiveTab] = useState('editor') // 'editor' | 'console'
  const runnerRef = useRef(null)
  const consoleEndRef = useRef(null)
  const editorRef = useRef(null)

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleEndRef.current && activeTab === 'console') {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [droneConsole, activeTab])

  // Initialize the drone runner once
  useEffect(() => {
    const getStore = () => useGameStore.getState()

    // Force-reset status to idle on mount since interpreter execution is transient
    useGameStore.getState().setDroneStatus('idle')

    const onLog = (text, type) => {
      useGameStore.getState().addDroneLog(text, type)
    }

    const onDroneMove = () => {
      // PixiFarmCanvas subscribes to droneRow/droneCol reactively
    }

    const onStatusChange = (status) => {
      useGameStore.getState().setDroneStatus(status)
    }

    runnerRef.current = createDroneRunner(getStore, onLog, onDroneMove, onStatusChange)

    return () => {
      if (runnerRef.current) {
        runnerRef.current.stop()
      }
    }
  }, [])

  const handleRun = useCallback(() => {
    if (runnerRef.current && droneStatus !== 'running') {
      useGameStore.getState().clearDroneConsole()
      setActiveTab('console')
      runnerRef.current.run(droneScript)
    }
  }, [droneScript, droneStatus])

  const handleStep = useCallback(() => {
    if (runnerRef.current) {
      if (droneStatus === 'idle') {
        useGameStore.getState().clearDroneConsole()
        setActiveTab('console')
        runnerRef.current.step(droneScript)
      } else if (droneStatus === 'paused') {
        runnerRef.current.step(droneScript)
      }
    }
  }, [droneScript, droneStatus])

  const handleResume = useCallback(() => {
    if (runnerRef.current && droneStatus === 'paused') {
      runnerRef.current.toggleStepMode(false)
      runnerRef.current.step(droneScript)
    }
  }, [droneScript, droneStatus])

  const handleStop = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.stop()
      useGameStore.getState().setDroneStatus('idle')
    }
  }, [])

  const handleEditorChange = useCallback((value) => {
    setDroneScript(value || '')
  }, [setDroneScript])

  // Sync editor with external store changes (like game reset or demo templates)
  // without interfering with the local keystroke buffer to preserve undo/redo history.
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue()
      if (droneScript !== currentValue) {
        editorRef.current.setValue(droneScript)
      }
    }
  }, [droneScript])

  /**
   * Configure Monaco when it mounts:
   * - Register drone/sensor autocomplete
   * - Set up the custom theme
   */
  function handleEditorMount(editor, monaco) {
    editorRef.current = editor

    // Configure JavaScript compiler options to target ES6 and include only ES6 core (no DOM/browser libraries)
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES6,
      lib: ['es6'],
      allowNonTsExtensions: true,
    })

    // Define a cozy dark theme matching the game aesthetic
    monaco.editor.defineTheme('drone-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c678dd' },
        { token: 'string', foreground: '98c379' },
        { token: 'number', foreground: 'd19a66' },
        { token: 'identifier', foreground: 'abb2bf' },
        { token: 'type', foreground: 'e5c07b' },
        { token: 'delimiter', foreground: 'abb2bf' },
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#abb2bf',
        'editor.lineHighlightBackground': '#2c313c44',
        'editorCursor.foreground': '#61afef',
        'editor.selectionBackground': '#3e4451',
        'editorLineNumber.foreground': '#495162',
        'editorLineNumber.activeForeground': '#abb2bf',
        'editorGutter.background': '#191a24',
        'editorWidget.background': '#21222c',
        'editorSuggestWidget.background': '#21222c',
        'editorSuggestWidget.border': '#3c2a21',
        'editorSuggestWidget.selectedBackground': '#3e4451',
      },
    })
    monaco.editor.setTheme('drone-dark')

    // Register drone API autocomplete
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        // Check if we're after "drone."
        const lineContent = model.getLineContent(position.lineNumber)
        const textBefore = lineContent.substring(0, position.column - 1)

        if (textBefore.endsWith('drone.')) {
          return {
            suggestions: [
              { label: 'harvest', kind: monaco.languages.CompletionItemKind.Method, insertText: 'harvest()', range, detail: 'Harvest the crop at the current tile', documentation: 'Harvests the ripe crop or mines ore at the drone\'s current position.' },
              { label: 'plant', kind: monaco.languages.CompletionItemKind.Method, insertText: "plant('${1:wheat}')", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: 'Plant a crop on tilled soil', documentation: 'Plants the specified crop. Options: wheat, carrot, beetroot, potato, watermelon, grass' },
              { label: 'till', kind: monaco.languages.CompletionItemKind.Method, insertText: 'till()', range, detail: 'Till turf into farmland', documentation: 'Tills the turf at the current position into soil. May reveal ores!' },
              { label: 'moveNext', kind: monaco.languages.CompletionItemKind.Method, insertText: 'moveNext()', range, detail: 'Move to the next tile', documentation: 'Moves the drone to the next tile (left-to-right, top-to-bottom, wrapping around).' },
              { label: 'moveTo', kind: monaco.languages.CompletionItemKind.Method, insertText: 'moveTo(${1:0}, ${2:0})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: 'Move to a specific tile (row, col)', documentation: 'Moves the drone to the specified grid position.' },
              { label: 'wait', kind: monaco.languages.CompletionItemKind.Method, insertText: 'wait(${1:1000})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: 'Wait for milliseconds', documentation: 'Pauses the drone for the specified duration.' },
              { label: 'charge', kind: monaco.languages.CompletionItemKind.Method, insertText: 'charge()', range, detail: 'Charge at base (0,0)', documentation: 'Fully recharges the drone. Must be positioned at the charging pad (0,0).' },
            ],
          }
        }

        if (textBefore.endsWith('sensor.')) {
          return {
            suggestions: [
              { label: 'isRipe', kind: monaco.languages.CompletionItemKind.Method, insertText: 'isRipe()', range, detail: 'Is the current tile ready to harvest?', documentation: 'Returns true if the current tile has a ripe crop.' },
              { label: 'isSoil', kind: monaco.languages.CompletionItemKind.Method, insertText: 'isSoil()', range, detail: 'Is the current tile tilled soil?', documentation: 'Returns true if the current tile is tilled farmland.' },
              { label: 'isTurf', kind: monaco.languages.CompletionItemKind.Method, insertText: 'isTurf()', range, detail: 'Is the current tile unplowed grass?', documentation: 'Returns true if the current tile is wild turf/grass.' },
              { label: 'isOre', kind: monaco.languages.CompletionItemKind.Method, insertText: 'isOre()', range, detail: 'Is the current tile an ore deposit?', documentation: 'Returns true if the current tile contains copper, iron, or crystal ore.' },
              { label: 'isGrowing', kind: monaco.languages.CompletionItemKind.Method, insertText: 'isGrowing()', range, detail: 'Is a crop currently growing here?', documentation: 'Returns true if the tile has a seedling or growing crop.' },
              { label: 'currentTile', kind: monaco.languages.CompletionItemKind.Method, insertText: 'currentTile()', range, detail: 'Get info about the current tile', documentation: 'Returns the full tile object: { type, crop, progress, baseType }' },
              { label: 'gridSize', kind: monaco.languages.CompletionItemKind.Method, insertText: 'gridSize()', range, detail: 'Get the grid dimension', documentation: 'Returns the current grid size (e.g. 3 for a 3x3 grid).' },
              { label: 'position', kind: monaco.languages.CompletionItemKind.Method, insertText: 'position()', range, detail: 'Get the drone position', documentation: 'Returns { row, col } of the drone\'s current position.' },
              { label: 'getEnergy', kind: monaco.languages.CompletionItemKind.Method, insertText: 'getEnergy()', range, detail: 'Get current energy level', documentation: 'Returns the current drone energy (0 - 100).' },
            ],
          }
        }

        // Global completions
        return {
          suggestions: [
            { label: 'drone', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'drone', range, detail: '🚁 Drone controller', documentation: 'The drone object. Use drone.harvest(), drone.plant(), drone.till(), drone.moveNext(), etc.' },
            { label: 'sensor', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'sensor', range, detail: '📡 Tile sensor', documentation: 'The sensor object. Use sensor.isRipe(), sensor.isSoil(), sensor.gridSize(), etc.' },
            { label: 'log', kind: monaco.languages.CompletionItemKind.Function, insertText: "log('${1:message}')", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '📝 Print to console', documentation: 'Prints a message to the drone console.' },
            { label: 'await', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'await ', range, detail: 'Wait for async action' },
          ],
        }
      },
    })
  }

  // Calculate line count for display
  const lineCount = (droneScript || '').split('\n').length

  return (
    <aside className="drone-logic-panel">
      {/* Panel Header */}
      <div className="drone-logic-panel__header">
        <div className="drone-logic-panel__header-left">
          <MaterialIcon icon="terminal" className="drone-logic-panel__header-icon" />
          <h3 className="drone-logic-panel__title font-headline-md">Drone Logic</h3>
        </div>
        <div className="drone-logic-panel__traffic-lights">
          <span className={`drone-logic-panel__dot ${droneStatus === 'running' ? 'drone-logic-panel__dot--running' : 'drone-logic-panel__dot--red'}`} />
          <span className="drone-logic-panel__dot drone-logic-panel__dot--amber" />
          <span className="drone-logic-panel__dot drone-logic-panel__dot--green" />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="drone-logic-panel__tabs">
        <button
          className={`drone-logic-panel__tab ${activeTab === 'editor' ? 'drone-logic-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          <MaterialIcon icon="code" />
          <span>Editor</span>
        </button>
        <button
          className={`drone-logic-panel__tab ${activeTab === 'console' ? 'drone-logic-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('console')}
        >
          <MaterialIcon icon="terminal" />
          <span>Console</span>
          {droneConsole.length > 0 && (
            <span className="drone-logic-panel__tab-badge">{droneConsole.length}</span>
          )}
        </button>
      </div>

      {/* Editor Panel — Monaco Editor */}
      {activeTab === 'editor' && (
        <div className="drone-logic-panel__editor">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            defaultValue={useGameStore.getState().droneScript || ''}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 20,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              readOnly: droneStatus === 'running',
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              padding: { top: 12, bottom: 12 },
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 12,
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              renderLineHighlight: 'line',
              fixedOverflowWidgets: true,
            }}
            loading={
              <div className="drone-logic-panel__loading">
                <span className="font-label-tech">Loading editor...</span>
              </div>
            }
          />
        </div>
      )}

      {/* Console Panel */}
      {activeTab === 'console' && (
        <div className="drone-logic-panel__console top-light-inset">
          {droneConsole.length === 0 ? (
            <div className="drone-logic-panel__console-empty">
              <MaterialIcon icon="smart_toy" />
              <span>Run your script to see output here</span>
            </div>
          ) : (
            <div className="drone-logic-panel__console-logs">
              {droneConsole.map((entry) => (
                <div key={entry.id} className={`drone-logic-panel__log drone-logic-panel__log--${entry.type}`}>
                  {entry.text}
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          )}
        </div>
      )}

      {/* API Reference Hint */}
      {activeTab === 'editor' && (
        <div className="drone-logic-panel__hints">
          <details className="drone-logic-panel__api-ref">
            <summary className="font-label-tech">📖 API Reference</summary>
            <div className="drone-logic-panel__api-list font-label-tech">
              <div className="drone-logic-panel__api-group">
                <span className="drone-logic-panel__api-title">🚁 drone</span>
                <code>await drone.harvest()</code>
                <code>await drone.plant('wheat')</code>
                <code>await drone.till()</code>
                <code>await drone.moveNext()</code>
                <code>await drone.moveTo(row, col)</code>
                <code>await drone.wait(1000)</code>
                <code>await drone.charge()</code>
              </div>
              <div className="drone-logic-panel__api-group">
                <span className="drone-logic-panel__api-title">📡 sensor</span>
                <code>sensor.isRipe()</code>
                <code>sensor.isSoil()</code>
                <code>sensor.isTurf()</code>
                <code>sensor.isOre()</code>
                <code>sensor.isGrowing()</code>
                <code>sensor.gridSize()</code>
                <code>sensor.position()</code>
                <code>sensor.getEnergy()</code>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Speed & Run Controls */}
      <div className="drone-logic-panel__footer">
        {/* Speed Selector */}
        <div className="drone-logic-panel__speed-bar font-label-tech">
          <span className="drone-logic-panel__speed-label">SPEED:</span>
          <div className="drone-logic-panel__speed-options">
            {[1.0, 2.0, 5.0, 20.0].map((speed) => (
              <button
                key={speed}
                className={`drone-logic-panel__speed-opt btn-press pixel-border ${droneSpeedMultiplier === speed ? 'drone-logic-panel__speed-opt--active' : ''}`}
                onClick={() => setDroneSpeedMultiplier(speed)}
              >
                {speed === 20.0 ? 'MAX' : `${speed}x`}
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="drone-logic-panel__actions">
          {droneStatus === 'running' ? (
            <button className="drone-logic-panel__stop-btn btn-press pixel-border-thick" onClick={handleStop}>
              <MaterialIcon icon="stop" filled />
              STOP
            </button>
          ) : droneStatus === 'paused' ? (
            <>
              <button className="drone-logic-panel__resume-btn btn-press pixel-border-thick" onClick={handleResume}>
                <MaterialIcon icon="play_arrow" filled />
                RESUME
              </button>
              <button className="drone-logic-panel__step-btn btn-press pixel-border-thick" onClick={handleStep}>
                <MaterialIcon icon="redo" />
                STEP NEXT
              </button>
              <button className="drone-logic-panel__stop-btn btn-press pixel-border-thick" onClick={handleStop}>
                <MaterialIcon icon="stop" filled />
                STOP
              </button>
            </>
          ) : (
            <>
              <button className="drone-logic-panel__run-btn btn-press pixel-border-thick" onClick={handleRun}>
                <MaterialIcon icon="play_arrow" filled />
                RUN SCRIPT
              </button>
              <button className="drone-logic-panel__step-btn btn-press pixel-border-thick" onClick={handleStep}>
                <MaterialIcon icon="redo" />
                STEP SCRIPT
              </button>
              <button
                className="drone-logic-panel__recall-btn btn-press pixel-border-thick"
                onClick={() => useGameStore.getState().recallAndCharge()}
                title="Recall drone to base and fully recharge"
              >
                <MaterialIcon icon="bolt" filled />
                RECALL & CHARGE
              </button>
            </>
          )}
          <button
            className="drone-logic-panel__save-btn btn-press pixel-border"
            onClick={() => useGameStore.getState().clearDroneConsole()}
            title="Clear Console"
          >
            <MaterialIcon icon="delete_sweep" />
          </button>
        </div>
      </div>
    </aside>
  )
}
