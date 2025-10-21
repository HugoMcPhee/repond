# Getting Started with Repond

A step-by-step guide to building your first Repond application.

---

## Installation

```bash
npm install repond
```

---

## Your First Repond App

Let's build a simple todo app to learn Repond fundamentals.

### Step 1: Define Your Store

Create a file `stores/todo.ts`:

```typescript
export const todoStore = {
  newState: () => ({
    text: "" as string,
    completed: false,
    createdAt: Date.now(),
  }),
  newRefs: () => ({}),
};
```

**Key points:**
- `newState`: Returns default state for a new todo
- Use `as string`, `as number` for proper TypeScript inference
- `newRefs`: For non-serializable data (we don't need any here)

### Step 2: Initialize Repond

Create `stores/index.ts`:

```typescript
import { initRepond } from "repond";
import { todoStore } from "./todo";

// Initialize Repond with your stores
initRepond(
  { todo: todoStore },
  ["default"] // Step names - "default" is used when no step is specified
);
```

### Step 3: Set Up TypeScript Types

Create `types/repond.ts`:

```typescript
import { todoStore } from "../stores/todo";

declare module "repond/declarations" {
  interface CustomRepondTypes {
    ItemTypeDefs: {
      todo: typeof todoStore;
    };
    StepNames: ["default"];
  }
}
```

This gives you full autocomplete and type safety!

### Step 4: Create Your React Component

```typescript
import { useState } from "react";
import { addItem, setState, removeItem, useStoreEffect } from "repond";

function TodoList() {
  const [inputValue, setInputValue] = useState("");
  const [todoIds, setTodoIds] = useState<string[]>([]);

  // Track all todo IDs - re-renders when todos are added/removed
  useStoreEffect({
    changes: ["todo.__added", "todo.__removed"],
    run: () => {
      // Get current todo IDs (using internal meta)
      const { meta } = require("repond/meta");
      setTodoIds([...meta.itemIdsByItemType["todo"]]);
    },
  });

  const handleAdd = () => {
    if (!inputValue.trim()) return;

    const todoId = `todo-${Date.now()}`;
    addItem("todo", todoId);
    setState("todo", { text: inputValue }, todoId);

    setInputValue("");
  };

  return (
    <div>
      <h1>My Todos</h1>

      <div>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd}>Add Todo</button>
      </div>

      <ul>
        {todoIds.map((todoId) => (
          <TodoItem key={todoId} todoId={todoId} />
        ))}
      </ul>
    </div>
  );
}

function TodoItem({ todoId }: { todoId: string }) {
  // Re-renders only when THIS todo's text or completed state changes
  const todo = useStore("todo", todoId, ["text", "completed"]);

  if (!todo) return null;

  return (
    <li style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => {
          setState("todo", { completed: e.target.checked }, todoId);
        }}
      />
      <span>{todo.text}</span>
      <button onClick={() => removeItem("todo", todoId)}>Delete</button>
    </li>
  );
}

export default TodoList;
```

### Step 5: Initialize in Your App

```typescript
import "./stores"; // Initialize Repond
import TodoList from "./components/TodoList";

function App() {
  return <TodoList />;
}

export default App;
```

---

## What You Just Learned

1. **Store Definition**: `newState()` and `newRefs()` define item structure
2. **Initialization**: `initRepond()` registers your stores
3. **Type Safety**: Extend `CustomRepondTypes` for autocomplete
4. **State Operations**:
   - `addItem()`: Create new items
   - `setState()`: Update item properties
   - `removeItem()`: Delete items
5. **React Integration**: `useStore()` provides reactive state

---

## Adding Effects

Let's add an effect that logs when todos are completed:

```typescript
import { makeEffects, initEffectGroups, startEffectsGroup } from "repond";

const todoEffects = makeEffects((makeEffect) => ({
  logCompletion: makeEffect(
    (todoId) => {
      const todo = getState("todo", todoId);
      if (todo.completed) {
        console.log(`✓ Completed: ${todo.text}`);
      }
    },
    { changes: ["todo.completed"] }
  ),
}));

initEffectGroups({ todoEffects });
startEffectsGroup("todoEffects");
```

**What this does:**
- Watches for changes to `todo.completed`
- Runs automatically when any todo's completed status changes
- Only runs for todos that actually changed

---

## Key Concepts

### 1. Automatic Batching

All `setState` calls are batched until the next frame:

```typescript
setState("todo", { text: "First" }, "todo1");
setState("todo", { text: "Second" }, "todo1"); // Overwrites first

// State updates on next frame
```

### 2. Type-Safe String Access

No store imports needed:

```typescript
// Autocompleted and type-safe!
const todo = getState("todo", todoId);
setState("todo", { completed: true }, todoId);
```

### 3. Selective Re-rendering

```typescript
// Only re-renders when text OR completed changes
const todo = useStore("todo", todoId, ["text", "completed"]);

// Re-renders when ANY property changes
const todo = useStore("todo", todoId);
```

---

## Next Steps

Now that you understand the basics, explore:

1. [Core Concepts](./CORE_CONCEPTS.md) - Deep dive into Repond's architecture
2. [API Reference](./API_REFERENCE.md) - Complete API documentation
3. [Migration Guides](./MIGRATION_REDUX.md) - Coming from Redux or Zustand?
4. [CLAUDE.md](../CLAUDE.md) - Comprehensive reference for AI agents

---

## Effect Function Parameters

Effects receive three parameters that provide context about what changed:

```typescript
makeEffect(
  (itemId: string, diffInfo: DiffInfo, frameDuration: number) => {
    // itemId: The ID of the item that changed
    // diffInfo: Details about what changed this frame
    // frameDuration: Milliseconds since last frame (for animations)
  },
  { changes: ["player.position"] }
)
```

### Using `itemId`

The item ID tells you which specific item triggered the effect:

```typescript
makeEffect(
  (playerId) => {
    const player = getState("player", playerId);
    console.log(`Player ${playerId} moved to`, player.position);
  },
  { changes: ["player.position"] }
)
```

### Using `diffInfo`

Access detailed information about what changed:

```typescript
makeEffect(
  (playerId, diffInfo) => {
    // Get which properties changed for this item
    const changedProps = diffInfo.propsChanged["player"]?.[playerId] || [];

    if (changedProps.includes("health")) {
      console.log("Health changed!");
    }

    // Check if item was just added
    const wasAdded = diffInfo.itemsAdded["player"]?.includes(playerId);
  },
  { changes: ["player.health", "player.position"] }
)
```

### Using `frameDuration`

Useful for time-based animations and physics:

```typescript
makeEffect(
  (itemId, diffInfo, frameDuration) => {
    const item = getState("item", itemId);

    // Calculate velocity (distance per second)
    const velocity = item.deltaPosition / frameDuration * 1000;

    // Apply time-scaled movement
    const newPosition = item.position + item.velocity * (frameDuration / 1000);
    setState("item", { position: newPosition }, itemId);
  },
  { changes: ["item.velocity"], step: "physics" }
)
```

---

## Common Patterns

### Derived State with Effects

```typescript
makeEffect(
  (playerId) => {
    const player = getState("player", playerId);
    const newLevel = Math.floor(player.experience / 100);
    setState("player", { level: newLevel }, playerId);
  },
  { changes: ["player.experience"], step: "gameLogic" }
);
```

### Watching Item Additions

```typescript
makeEffect(
  (enemyId) => {
    console.log("New enemy spawned:", enemyId);
  },
  { changes: ["enemy.__added"] } // Special __added key
);
```

### Global Effects (Not Per-Item)

```typescript
import { getState } from "repond";

makeEffect(
  () => {
    // Get all player state by accessing the state for the item type
    const allPlayers = getState("player"); // Returns first player
    // To count all players, use Object.keys on the internal structure
    // Note: A getAllState() helper may be added in a future version
    console.log("Player state changed");
  },
  { changes: ["player.__added", "player.__removed"], isPerItem: false }
);
```

---

## Troubleshooting

### Effect Not Running?

1. Check `changes` array matches actual prop paths
2. Ensure effect group is started
3. Verify state is actually changing (use `getPrevState` to compare)

### TypeScript Errors?

1. Ensure `CustomRepondTypes` is declared
2. Use `as string`, `as number` in `newState()`
3. Import types file in your entry point

### Performance Issues?

1. Use selective props in `useStore()`: `["prop1", "prop2"]`
2. Check for effect infinite loops (effect modifying what it watches)
3. Use `step` system to control effect execution order

---

## Accessing All Item IDs

A common need is getting all item IDs for a specific item type. Here are the recommended patterns:

### Pattern 1: Using React State with Effects

For React components, track item IDs with state:

```typescript
import { useState } from "react";
import { useStoreEffect } from "repond";

function TodoList() {
  const [todoIds, setTodoIds] = useState<string[]>([]);

  // Update IDs whenever items are added or removed
  useStoreEffect({
    changes: ["todo.__added", "todo.__removed"],
    run: () => {
      // Access internal meta to get current IDs
      // Note: This uses internal API that may change
      const { meta } = require("repond/meta");
      setTodoIds([...meta.itemIdsByItemType["todo"]]);
    },
  });

  return (
    <ul>
      {todoIds.map((todoId) => (
        <TodoItem key={todoId} todoId={todoId} />
      ))}
    </ul>
  );
}
```

### Pattern 2: Manual Tracking

Keep your own list of IDs:

```typescript
// Store all todo IDs yourself
const todoIdsList: string[] = [];

function addTodo(text: string) {
  const todoId = `todo-${Date.now()}`;
  todoIdsList.push(todoId);

  addItem("todo", todoId);
  setState("todo", { text }, todoId);
}

function removeTodo(todoId: string) {
  const index = todoIdsList.indexOf(todoId);
  if (index > -1) {
    todoIdsList.splice(index, 1);
  }

  removeItem("todo", todoId);
}
```

### Pattern 3: Using a Dedicated "Manager" Item

Create a special item that tracks IDs:

```typescript
const todoManagerStore = {
  newState: () => ({
    allTodoIds: [] as string[],
  }),
  newRefs: () => ({}),
};

// Initialize with one manager
addItem("todoManager", "main");

// When adding todos
function addTodo(text: string) {
  const todoId = `todo-${Date.now()}`;
  const manager = getState("todoManager", "main");

  addItem("todo", todoId);
  setState("todo", { text }, todoId);
  setState("todoManager", { allTodoIds: [...manager.allTodoIds, todoId] }, "main");
}

// In components
const manager = useStore("todoManager", "main", ["allTodoIds"]);
manager.allTodoIds.map(id => /* ... */);
```

### Future API

A `getItemIds(itemType)` helper function may be added in a future version to simplify this pattern:

```typescript
// Potential future API (not yet implemented)
const todoIds = getItemIds("todo");
```

---

Ready to learn more? Check out the [Core Concepts Guide](./CORE_CONCEPTS.md)!
