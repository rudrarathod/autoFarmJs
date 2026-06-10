import { useMemo, useState, useEffect } from 'react'
import { ReactFlow, Background, Controls, ReactFlowProvider, useReactFlow, BaseEdge, getBezierPath } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './ProgressTreePage.css'
import TopAppBar from '../components/common/TopAppBar.jsx'
import BottomNavBar from '../components/common/BottomNavBar.jsx'
import TreeNode from '../components/progress/TreeNode.jsx'
import { useGameStore } from '../store/gameStore.js'
import skillTree from '../config/skillTree.json'

// Define nodeTypes mapping for custom skill nodes
const nodeTypes = {
  skillNode: TreeNode,
}

function SmartConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const { getNodes } = useReactFlow()
  const nodes = getNodes()

  const yDiff = targetY - sourceY

  let path = ''
  if (yDiff > 240) {
    // Find intermediate nodes that lie vertically between sourceY and targetY
    const verticalMargin = 10
    const minY = Math.min(sourceY, targetY) + verticalMargin
    const maxY = Math.max(sourceY, targetY) - verticalMargin

    const intersectingNodes = nodes.filter(n => {
      const nodeMinY = n.position.y
      const nodeMaxY = n.position.y + 110 // estimate node height
      return nodeMinY < maxY && nodeMaxY > minY
    })

    const cardWidth = 190
    const padding = 10

    // Candidate routing X coordinates in order of preference
    const directCenter = (sourceX + targetX) / 2
    const candidates = [
      directCenter,
      // Close bypasses
      sourceX > targetX ? Math.max(sourceX, targetX) + 120 : Math.min(sourceX, targetX) - 120,
      sourceX > targetX ? Math.min(sourceX, targetX) - 120 : Math.max(sourceX, targetX) + 120,
      // Far bypasses (for parallel nodes)
      sourceX > targetX ? Math.max(sourceX, targetX) + 240 : Math.min(sourceX, targetX) - 240,
      sourceX > targetX ? Math.min(sourceX, targetX) - 240 : Math.max(sourceX, targetX) + 240,
    ]

    let chosenX = directCenter
    for (const x of candidates) {
      const collides = intersectingNodes.some(n => {
        const nodeMinX = n.position.x - padding
        const nodeMaxX = n.position.x + cardWidth + padding
        return x >= nodeMinX && x <= nodeMaxX
      })
      if (!collides) {
        chosenX = x
        break
      }
    }

    if (Math.abs(chosenX - sourceX) < 5 && Math.abs(chosenX - targetX) < 5) {
      path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
    } else {
      path = `M ${sourceX} ${sourceY} ` +
             `C ${sourceX} ${sourceY + 30}, ${chosenX} ${sourceY + 10}, ${chosenX} ${sourceY + 40} ` +
             `L ${chosenX} ${targetY - 40} ` +
             `C ${chosenX} ${targetY - 10}, ${targetX} ${targetY - 30}, ${targetX} ${targetY}`
    }
  } else {
    const [bezierPath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })
    path = bezierPath
  }

  return (
    <BaseEdge
      path={path}
      markerEnd={markerEnd}
      style={style}
    />
  )
}

const edgeTypes = {
  smartEdge: SmartConnectionEdge,
}

// Find a node by ID recursively in the JSON tree structure
const findNodeById = (node, id) => {
  if (node.id === id) return node
  if (node.children) {
    for (const child of Object.values(node.children)) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }
  return null
}

export function ProgressTreePageContent() {
  const getNodeStatus = useGameStore((state) => state.getNodeStatus)
  const unlockNode = useGameStore((state) => state.unlockNode)
  const xp = useGameStore((state) => state.xp)
  const unlockedNodes = useGameStore((state) => state.unlockedNodes)

  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() })
  }

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleUnlock = (nodeId, cost) => {
    if (xp < cost) {
      showToast(`❌ Need ${(cost - xp).toLocaleString()} more XP to unlock!`, 'error')
      return
    }

    const success = unlockNode(nodeId, cost)
    if (success) {
      const nodeData = findNodeById(skillTree, nodeId)
      const title = nodeData ? nodeData.name : nodeId
      showToast(`🎉 Unlocked: ${title}!`, 'success')
    } else {
      showToast(`❌ Cannot unlock: prerequisite nodes must be unlocked first!`, 'error')
    }
  }

  // Parse skillTree.json into React Flow nodes and edges with dynamic coordinates
  const { flowNodes, flowEdges, translateExtent } = useMemo(() => {
    const nodes = []
    const edges = []

    // Helper to build edges with themed colors
    const addEdge = (source, target, sourceStatus, targetStatus, branchColor) => {
      const isUnlocked = sourceStatus === 'unlocked' && targetStatus === 'unlocked'
      const isReachable = sourceStatus === 'unlocked' && targetStatus === 'reachable'

      let stroke = '#6f7a6b' // locked default
      let strokeWidth = 2
      let animated = false

      if (isUnlocked) {
        stroke = branchColor || '#4caf50' // themed active color
        strokeWidth = 4
      } else if (isReachable) {
        stroke = '#ff9800' // reachable orange glow
        strokeWidth = 3
        animated = true
      }

      edges.push({
        id: `${source}-${target}`,
        source,
        target,
        type: 'smartEdge',
        animated,
        style: { stroke, strokeWidth },
      })
    }

    // Dynamic Collision-Free Layout Engine
    // 1. Calculate relative coordinates for each branch independently
    const verticalSpacing = 220
    const subSpacing = 220
    const cardWidth = 190

    const getSubtreeDepth = (node, isSequential = false) => {
      if (!node.children || Object.keys(node.children).length === 0) {
        return 1
      }
      let layoutMode = node.layout
      if (!layoutMode) {
        const isBranchHeader = skillTree.children && Object.keys(skillTree.children).includes(node.id)
        layoutMode = isBranchHeader ? 'sequential' : 'parallel'
      }
      const childDepths = Object.values(node.children).map(child =>
        getSubtreeDepth(child, child.layout === 'sequential')
      )
      if (layoutMode === 'sequential') {
        return 1 + childDepths.reduce((sum, d) => sum + d, 0)
      } else {
        return 1 + Math.max(...childDepths)
      }
    }

    const getLeaves = (node) => {
      if (node.requireChildren === false) {
        return [node.id]
      }
      if (!node.children || Object.keys(node.children).length === 0) {
        return [node.id]
      }
      let leaves = []
      Object.values(node.children).forEach(child => {
        leaves = leaves.concat(getLeaves(child))
      })
      return leaves
    }

    if (!skillTree.children) return { flowNodes: nodes, flowEdges: edges }

    const branchIds = Object.keys(skillTree.children)
    const branchesLayout = []

    branchIds.forEach((branchId) => {
      const branch = skillTree.children[branchId]
      const branchColor = branch.color || '#4F46E5'
      const branchStatus = getNodeStatus(branchId)

      const branchNodes = []
      const branchEdges = []

      const layoutNode = (node, relativeX, currentY, isSequential, parentIds) => {
        const status = getNodeStatus(node.id)
        const xpCost = node.xpCost

        branchNodes.push({
          id: node.id,
          x: relativeX,
          y: currentY,
          data: {
            icon: node.icon,
            title: node.name,
            description: node.description || '',
            xpCost,
            color: branchColor,
            status,
            onUnlock: () => handleUnlock(node.id, xpCost || 0),
          }
        })

        const effectiveParentIds = node.parents || parentIds
        effectiveParentIds.forEach(pId => {
          branchEdges.push({
            source: pId,
            target: node.id,
            branchColor
          })
        })

        if (node.children) {
          const childrenKeys = Object.keys(node.children)
          const childrenValues = Object.values(node.children)

          let layoutMode = node.layout
          if (!layoutMode) {
            const isBranchHeader = skillTree.children && Object.keys(skillTree.children).includes(node.id)
            layoutMode = isBranchHeader ? 'sequential' : 'parallel'
          }

          if (layoutMode === 'sequential') {
            let prevIds = [node.id]
            let nextY = currentY + verticalSpacing

            childrenValues.forEach((child) => {
              const childIsSequential = child.layout === 'sequential'
              layoutNode(child, relativeX, nextY, childIsSequential, prevIds)
              prevIds = getLeaves(child)
              const depth = getSubtreeDepth(child, childIsSequential)
              nextY += depth * verticalSpacing
            })
          } else {
            const subCount = childrenKeys.length
            const subStartX = relativeX - ((subCount - 1) * subSpacing) / 2

            childrenValues.forEach((child, idx) => {
              const subX = subStartX + idx * subSpacing
              const subY = currentY + verticalSpacing
              const childIsSequential = child.layout === 'sequential'
              layoutNode(child, subX, subY, childIsSequential, [node.id])
            })
          }
        }
      }

      layoutNode(branch, 0, 270, true, [])

      const minX = Math.min(...branchNodes.map(n => n.x))
      const maxX = Math.max(...branchNodes.map(n => n.x))

      branchesLayout.push({
        branchId,
        nodes: branchNodes,
        edges: branchEdges,
        minX,
        maxX,
        branchStatus,
        branchColor
      })
    })

    // 2. Position branches side-by-side to avoid any collision
    const columnGap = 120 // safe pixel margin between card edges
    let nextAvailableLeftEdge = 0

    branchesLayout.forEach((layout) => {
      // Find relative boundaries
      const leftBoundary = layout.minX - cardWidth / 2
      const rightBoundary = layout.maxX + cardWidth / 2

      // Shift this column so its left edge lines up with nextAvailableLeftEdge
      const shift = nextAvailableLeftEdge - leftBoundary
      layout.nodes.forEach(n => {
        n.x += shift
      })

      // The new right edge of this column
      const colRightEdge = rightBoundary + shift
      nextAvailableLeftEdge = colRightEdge + columnGap
    })

    // 3. Center the entire set of columns around x = 800
    const totalWidth = nextAvailableLeftEdge - columnGap
    const centeringShift = 800 - totalWidth / 2

    branchesLayout.forEach((layout) => {
      layout.nodes.forEach(n => {
        n.x += centeringShift
      })
    })

    // 4. Center root node above all branch headers
    const rootId = skillTree.id
    const rootStatus = getNodeStatus(rootId)
    const rootColor = skillTree.color || '#10B981'

    // Centered root coordinate is average of first and last branch header centers
    const firstHeaderX = branchesLayout[0].nodes[0].x
    const lastHeaderX = branchesLayout[branchesLayout.length - 1].nodes[0].x
    const rootX = (firstHeaderX + lastHeaderX) / 2

    nodes.push({
      id: rootId,
      type: 'skillNode',
      position: { x: rootX, y: 50 },
      data: {
        icon: skillTree.icon || 'agriculture',
        title: skillTree.name || 'Rural Automation',
        description: skillTree.description || '',
        xpCost: skillTree.xpCost,
        color: rootColor,
        status: rootStatus,
        onUnlock: () => {},
      },
      draggable: false,
    })

    // 5. Populate React Flow arrays
    branchesLayout.forEach((layout) => {
      // Add root edge to this branch header
      addEdge(rootId, layout.branchId, rootStatus, layout.branchStatus, layout.branchColor)

      // Add all laid out nodes
      layout.nodes.forEach(n => {
        nodes.push({
          id: n.id,
          type: 'skillNode',
          position: { x: n.x, y: n.y },
          data: n.data,
          draggable: false,
        })
      })

      // Add all branch edges
      layout.edges.forEach(e => {
        addEdge(e.source, e.target, getNodeStatus(e.source), getNodeStatus(e.target), e.branchColor)
      })
    })

    // Calculate bounds for translateExtent to keep tree on screen
    const xCoords = nodes.map(n => n.position.x)
    const yCoords = nodes.map(n => n.position.y)
    const minX = Math.min(...xCoords) - 300
    const maxX = Math.max(...xCoords) + 190 + 300
    const minY = Math.min(...yCoords) - 150
    const maxY = Math.max(...yCoords) + 150 + 300

    return {
      flowNodes: nodes,
      flowEdges: edges,
      translateExtent: [[minX, minY], [maxX, maxY]]
    }
  }, [unlockedNodes, xp, getNodeStatus])

  const { setViewport } = useReactFlow()
  const [prevRootX, setPrevRootX] = useState(0)

  // Find root node coordinate to center on
  const rootNode = flowNodes.find(n => n.id === 'ruralAutomation')
  const rootX = rootNode ? rootNode.position.x : 0

  useEffect(() => {
    if (rootX && rootX !== prevRootX) {
      const zoom = 0.75
      const containerWidth = window.innerWidth
      const x = containerWidth / 2 - (rootX * zoom)
      const y = 40
      setViewport({ x, y, zoom })
      setPrevRootX(rootX)
    }
  }, [rootX, setViewport, prevRootX])

  return (
    <div className="progress-tree-page">
      {/* Top App Bar */}
      <TopAppBar activeTab="progress" showTabs={true} />

      {/* Main Workspace with React Flow */}
      <div className="progress-tree-page__workspace">
        <div className="progress-tree-page__flow-container">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            minZoom={0.25}
            maxZoom={2.0}
            panOnDrag={true}
            zoomOnScroll={false}
            panOnScroll={true}
            preventScrolling={true}
            translateExtent={translateExtent}
          >
            <Background color="#3c2a21" gap={20} size={1} />
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
        </div>
      </div>

      {/* Toast Notification popup */}
      {toast && (
        <div className={`progress-tree-page__toast pixel-border top-light-inset progress-tree-page__toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <BottomNavBar activeItem="research" />
    </div>
  )
}

export default function ProgressTreePage() {
  return (
    <ReactFlowProvider>
      <ProgressTreePageContent />
    </ReactFlowProvider>
  )
}
