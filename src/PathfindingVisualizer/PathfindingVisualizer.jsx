import React, { Component } from "react";
import Node from "./Node/Node";
import { dijkstra } from "../algorithms/dijkstra";
import { AStar } from "../algorithms/aStar";
import { dfs } from "../algorithms/dfs";
import { bfs } from "../algorithms/bfs";

import "./PathfindingVisualizer.css";

export default class PathfindingVisualizer extends Component {
  constructor() {
    super();
    this.state = {
      grid: [],
      START_NODE_ROW: 5,
      FINISH_NODE_ROW: 5,
      START_NODE_COL: 5,
      FINISH_NODE_COL: 15,
      mouseIsPressed: false,
      ROW_COUNT: 25,
      COLUMN_COUNT: 35,
      MOBILE_ROW_COUNT: 10,
      MOBILE_COLUMN_COUNT: 20,
      isRunning: false,
      isStartNode: false,
      isFinishNode: false,
      isWallNode: false, // xxxxxxx
      currRow: 0,
      currCol: 0,
      isDesktopView: true,
      bfsVisitedNodes: 0,
      aStarVisitedNodes: 0,
      shortestpathByAstar: 0,
      shortestpathByBFS: 0,
      bfsRunningTime: 0,
      aStarRunningTime: 0,
      shortestPathByDFS: 0,
      shortestPathByDijkstra: 0,
      DijkstraRunningTime: 0,
      DFSRunningTime: 0,
      DijkstraVisitedNodes: 0,
      DFSVisitedNodes: 0,
    };

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.toggleIsRunning = this.toggleIsRunning.bind(this);
  }

  componentDidMount() {
    const grid = this.getInitialGrid();
    this.setState({ grid });
  }

  toggleIsRunning() {
    this.setState({ isRunning: !this.state.isRunning });
  }

  toggleView() {
    if (!this.state.isRunning) {
      this.clearGrid();
      this.clearWalls();
      const isDesktopView = !this.state.isDesktopView;
      let grid;
      if (isDesktopView) {
        grid = this.getInitialGrid(
          this.state.ROW_COUNT,
          this.state.COLUMN_COUNT
        );
        this.setState({ isDesktopView, grid });
      } else {
        if (
          this.state.START_NODE_ROW > this.state.MOBILE_ROW_COUNT ||
          this.state.FINISH_NODE_ROW > this.state.MOBILE_ROW_COUNT ||
          this.state.START_NODE_COL > this.state.MOBILE_COLUMN_COUNT ||
          this.state.FINISH_NODE_COL > this.state.MOBILE_COLUMN_COUNT
        ) {
          alert("Start & Finish Nodes Must Be within 10 Rows x 20 Columns");
        } else {
          grid = this.getInitialGrid(
            this.state.MOBILE_ROW_COUNT,
            this.state.MOBILE_COLUMN_COUNT
          );
          this.setState({ isDesktopView, grid });
        }
      }
    }
  }

  /******************** Set up the initial grid ********************/
  getInitialGrid = (
    rowCount = this.state.ROW_COUNT,
    colCount = this.state.COLUMN_COUNT
  ) => {
    const initialGrid = [];
    for (let row = 0; row < rowCount; row++) {
      const currentRow = [];
      for (let col = 0; col < colCount; col++) {
        currentRow.push(this.createNode(row, col));
      }
      initialGrid.push(currentRow);
    }
    return initialGrid;
  };

  createNode = (row, col) => {
    return {
      row,
      col,
      isStart:
        row === this.state.START_NODE_ROW && col === this.state.START_NODE_COL,
      isFinish:
        row === this.state.FINISH_NODE_ROW &&
        col === this.state.FINISH_NODE_COL,
      distance: Infinity,
      distanceToFinishNode:
        Math.abs(this.state.FINISH_NODE_ROW - row) +
        Math.abs(this.state.FINISH_NODE_COL - col),
      isVisited: false,
      isWall: false,
      previousNode: null,
      isNode: true,
    };
  };

  /******************** Control mouse events ********************/
  handleMouseDown(row, col) {
    if (!this.state.isRunning) {
      if (this.isGridClear()) {
        if (
          document.getElementById(`node-${row}-${col}`).className ===
          "node node-start"
        ) {
          this.setState({
            mouseIsPressed: true,
            isStartNode: true,
            currRow: row,
            currCol: col,
          });
        } else if (
          document.getElementById(`node-${row}-${col}`).className ===
          "node node-finish"
        ) {
          this.setState({
            mouseIsPressed: true,
            isFinishNode: true,
            currRow: row,
            currCol: col,
          });
        } else {
          const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
          this.setState({
            grid: newGrid,
            mouseIsPressed: true,
            isWallNode: true,
            currRow: row,
            currCol: col,
          });
        }
      } else {
        this.clearGrid();
      }
    }
  }

  isGridClear() {
    for (const row of this.state.grid) {
      for (const node of row) {
        const nodeClassName = document.getElementById(
          `node-${node.row}-${node.col}`
        ).className;
        if (
          nodeClassName === "node node-visited" ||
          nodeClassName === "node node-shortest-path"
        ) {
          return false;
        }
      }
    }
    return true;
  }

  handleMouseEnter(row, col) {
    if (!this.state.isRunning) {
      if (this.state.mouseIsPressed) {
        const nodeClassName = document.getElementById(
          `node-${row}-${col}`
        ).className;
        if (this.state.isStartNode) {
          if (nodeClassName !== "node node-wall") {
            const prevStartNode =
              this.state.grid[this.state.currRow][this.state.currCol];
            prevStartNode.isStart = false;
            document.getElementById(
              `node-${this.state.currRow}-${this.state.currCol}`
            ).className = "node";

            this.setState({ currRow: row, currCol: col });
            const currStartNode = this.state.grid[row][col];
            currStartNode.isStart = true;
            document.getElementById(`node-${row}-${col}`).className =
              "node node-start";
          }
          this.setState({ START_NODE_ROW: row, START_NODE_COL: col });
        } else if (this.state.isFinishNode) {
          if (nodeClassName !== "node node-wall") {
            const prevFinishNode =
              this.state.grid[this.state.currRow][this.state.currCol];
            prevFinishNode.isFinish = false;
            document.getElementById(
              `node-${this.state.currRow}-${this.state.currCol}`
            ).className = "node";

            this.setState({ currRow: row, currCol: col });
            const currFinishNode = this.state.grid[row][col];
            currFinishNode.isFinish = true;
            document.getElementById(`node-${row}-${col}`).className =
              "node node-finish";
          }
          this.setState({ FINISH_NODE_ROW: row, FINISH_NODE_COL: col });
        } else if (this.state.isWallNode) {
          const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
          this.setState({ grid: newGrid });
        }
      }
    }
  }

  handleMouseUp(row, col) {
    if (!this.state.isRunning) {
      this.setState({ mouseIsPressed: false });
      if (this.state.isStartNode) {
        const isStartNode = !this.state.isStartNode;
        this.setState({
          isStartNode,
          START_NODE_ROW: row,
          START_NODE_COL: col,
        });
      } else if (this.state.isFinishNode) {
        const isFinishNode = !this.state.isFinishNode;
        this.setState({
          isFinishNode,
          FINISH_NODE_ROW: row,
          FINISH_NODE_COL: col,
        });
      }
      this.getInitialGrid();
    }
  }

  handleMouseLeave() {
    if (this.state.isStartNode) {
      const isStartNode = !this.state.isStartNode;
      this.setState({ isStartNode, mouseIsPressed: false });
    } else if (this.state.isFinishNode) {
      const isFinishNode = !this.state.isFinishNode;
      this.setState({ isFinishNode, mouseIsPressed: false });
    } else if (this.state.isWallNode) {
      const isWallNode = !this.state.isWallNode;
      this.setState({ isWallNode, mouseIsPressed: false });
      this.getInitialGrid();
    }
  }

  /******************** Clear Board/Walls ********************/
  clearData() {
    this.setState({
      bfsVisitedNodes: 0,
      aStarVisitedNodes: 0,
      DijkstraVisitedNodes: 0,
      DFSVisitedNodes: 0,
      shortestpathByAstar: 0,
      shortestpathByBFS: 0,
      shortestPathByDFSDijkstra: 0,
      shortestPathByDFS: 0,
      bfsRunningTime: 0,
      aStarRunningTime: 0,
      DFSRunningTime: 0,
      DijkstraRunningTime: 0,
    });
  }
  clearGrid() {
    if (!this.state.isRunning) {
      const newGrid = this.state.grid.slice();
      for (const row of newGrid) {
        for (const node of row) {
          let nodeClassName = document.getElementById(
            `node-${node.row}-${node.col}`
          ).className;
          if (
            nodeClassName !== "node node-start" &&
            nodeClassName !== "node node-finish" &&
            nodeClassName !== "node node-wall"
          ) {
            document.getElementById(`node-${node.row}-${node.col}`).className =
              "node";
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode =
              Math.abs(this.state.FINISH_NODE_ROW - node.row) +
              Math.abs(this.state.FINISH_NODE_COL - node.col);
          }
          if (nodeClassName === "node node-finish") {
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode = 0;
          }
          if (nodeClassName === "node node-start") {
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode =
              Math.abs(this.state.FINISH_NODE_ROW - node.row) +
              Math.abs(this.state.FINISH_NODE_COL - node.col);
            node.isStart = true;
            node.isWall = false;
            node.previousNode = null;
            node.isNode = true;
          }
        }
      }
    }
  }

  clearWalls() {
    if (!this.state.isRunning) {
      const newGrid = this.state.grid.slice();
      for (const row of newGrid) {
        for (const node of row) {
          let nodeClassName = document.getElementById(
            `node-${node.row}-${node.col}`
          ).className;
          if (nodeClassName === "node node-wall") {
            document.getElementById(`node-${node.row}-${node.col}`).className =
              "node";
            node.isWall = false;
          }
        }
      }
    }
  }

  /******************** Create Animations ********************/
  visualize(algo) {
    if (!this.state.isRunning) {
      this.clearGrid();
      this.toggleIsRunning();
      const { grid } = this.state;
      const startNode =
        grid[this.state.START_NODE_ROW][this.state.START_NODE_COL];
      const finishNode =
        grid[this.state.FINISH_NODE_ROW][this.state.FINISH_NODE_COL];
      let visitedNodesInOrder, time, nodesInShortestPathOrder, shortestPath;
      switch (algo) {
        case "Dijkstra":
          [visitedNodesInOrder, time] = dijkstra(grid, startNode, finishNode);
          console.log(visitedNodesInOrder.length, time);
          nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
          this.setState({
            DijkstraVisitedNodes: visitedNodesInOrder.length,
            shortestPathByDijkstra: nodesInShortestPathOrder.length,
            DijkstraRunningTime: time,
          });
          break;
        case "AStar":
          [visitedNodesInOrder, time] = AStar(grid, startNode, finishNode);
          console.log(visitedNodesInOrder.length, time);
          nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
          this.setState({
            aStarVisitedNodes: visitedNodesInOrder.length,
            shortestpathByAstar: nodesInShortestPathOrder.length,
            aStarRunningTime: time,
          });
          break;
        case "BFS":
          [visitedNodesInOrder, time] = bfs(grid, startNode, finishNode);
          console.log(visitedNodesInOrder.length, time);
          nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
          this.setState({
            bfsVisitedNodes: visitedNodesInOrder.length,
            shortestpathByBFS: nodesInShortestPathOrder.length,
            bfsRunningTime: time,
          });
          break;
        case "DFS":
          [visitedNodesInOrder, time] = dfs(grid, startNode, finishNode);
          console.log(visitedNodesInOrder.length, time);
          nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
          this.setState({
            DFSVisitedNodes: visitedNodesInOrder.length,
            shortestPathByDFS: nodesInShortestPathOrder.length,
            DFSRunningTime: time,
          });
          break;
        default:
          // should never get here
          break;
      }

      nodesInShortestPathOrder.push("end");
      this.animate(visitedNodesInOrder, nodesInShortestPathOrder);
    }
  }

  animate(visitedNodesInOrder, nodesInShortestPathOrder) {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          this.animateShortestPath(nodesInShortestPathOrder);
        }, 10 * i);
        return;
      }
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        const nodeClassName = document.getElementById(
          `node-${node.row}-${node.col}`
        ).className;
        if (
          nodeClassName !== "node node-start" &&
          nodeClassName !== "node node-finish"
        ) {
          document.getElementById(`node-${node.row}-${node.col}`).className =
            "node node-visited";
        }
      }, 10 * i);
    }
  }

  /******************** Create path from start to finish ********************/
  animateShortestPath(nodesInShortestPathOrder) {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      if (nodesInShortestPathOrder[i] === "end") {
        setTimeout(() => {
          this.toggleIsRunning();
        }, i * 50);
      } else {
        setTimeout(() => {
          const node = nodesInShortestPathOrder[i];
          const nodeClassName = document.getElementById(
            `node-${node.row}-${node.col}`
          ).className;
          if (
            nodeClassName !== "node node-start" &&
            nodeClassName !== "node node-finish"
          ) {
            document.getElementById(`node-${node.row}-${node.col}`).className =
              "node node-shortest-path";
          }
        }, i * 40);
      }
    }
  }

  render() {
    const {
      grid,
      mouseIsPressed,
      bfsVisitedNodes,
      aStarVisitedNodes,
      shortestpathByAstar,
      shortestpathByBFS,
      bfsRunningTime,
      aStarRunningTime,
      DFSVisitedNodes,
      DFSRunningTime,
      shortestPathByDFS,
      DijkstraVisitedNodes,
      DijkstraRunningTime,
      shortestPathByDijkstra,
    } = this.state;
    return (
      <div>
        <div className="title">
          Comparison of shortest path finding algorithms (BFS, A*, DFS,
          Dijkstra)
        </div>
        <div className="legands">
          <div>
            <div className="legand green"></div>
            <span>User (Source)</span>
          </div>
          <div>
            <div className="legand blue"></div>
            <span>Fire exit (Destination)</span>
          </div>
          <div>
            <div className="legand brown"></div>
            <span>Walls (Obstacles)</span>
          </div>
        </div>

        <table
          className="grid-container"
          onMouseLeave={() => this.handleMouseLeave()}
        >
          <tbody className="grid">
            {grid.map((row, rowIdx) => {
              return (
                <tr key={rowIdx}>
                  {row.map((node, nodeIdx) => {
                    const { row, col, isFinish, isStart, isWall } = node;
                    return (
                      <Node
                        key={nodeIdx}
                        col={col}
                        isFinish={isFinish}
                        isStart={isStart}
                        isWall={isWall}
                        mouseIsPressed={mouseIsPressed}
                        onMouseDown={(row, col) =>
                          this.handleMouseDown(row, col)
                        }
                        onMouseEnter={(row, col) =>
                          this.handleMouseEnter(row, col)
                        }
                        onMouseUp={() => this.handleMouseUp(row, col)}
                        row={row}
                      ></Node>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="buttons">
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              this.clearGrid();
              this.clearData();
            }}
          >
            Clear Grid
          </button>
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => this.clearWalls()}
          >
            Clear Walls
          </button>
        </div>
        <div className="algos">
          <button
            type="button"
            className="custom-button"
            onClick={() => this.visualize("AStar")}
          >
            A*
          </button>
          <button
            type="button"
            className="custom-button"
            onClick={() => this.visualize("BFS")}
          >
            Breadth-first search
          </button>
          <button
            type="button"
            className="custom-button"
            onClick={() => this.visualize("DFS")}
          >
            DFS
          </button>
          <button
            type="button"
            className="custom-button"
            onClick={() => this.visualize("Dijkstra")}
          >
            Dijkstra
          </button>
        </div>
        <div className="section">
          <div>
            <div>Total paths visited by A*: {aStarVisitedNodes}</div>
            <div>Shortest path using A*: {shortestpathByAstar}</div>
            <div>Total time taken using A*: {aStarRunningTime} ms</div>
          </div>
          <div>
            <div>Total paths visited by BFS: {bfsVisitedNodes}</div>
            <div>Shortest path using BFS: {shortestpathByBFS}</div>
            <div>Total time taken using BFS: {bfsRunningTime * 3} ms</div>
          </div>
          <div>
            <div>Total paths visited by DFS: {DFSVisitedNodes}</div>
            <div>Shortest path using DFS: {shortestPathByDFS}</div>
            <div>Total time taken using DFS: {DFSRunningTime} ms</div>
          </div>
          <div>
            <div>Total paths visited by Dijkstra: {DijkstraVisitedNodes}</div>
            <div>Shortest path using Dijkstra: {shortestPathByDijkstra}</div>
            <div>Total time taken using Dijkstra: {DijkstraRunningTime} ms</div>
          </div>
        </div>
      </div>
    );
  }
}

/******************** Create Walls ********************/
const getNewGridWithWallToggled = (grid, row, col) => {
  // mouseDown starts to act strange if I don't make newGrid and work off of grid instead.
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  if (!node.isStart && !node.isFinish && node.isNode) {
    const newNode = {
      ...node,
      isWall: !node.isWall,
    };
    newGrid[row][col] = newNode;
  }
  return newGrid;
};

// Backtracks from the finishNode to find the shortest path.
// Only works when called after the pathfinding methods.
function getNodesInShortestPathOrder(finishNode) {
  const nodesInShortestPathOrder = [];
  let currentNode = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
}
