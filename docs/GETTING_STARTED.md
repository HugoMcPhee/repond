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
initRepond({
  storeNames: ["todo"] as const,
  itemStores: { todo: todoStore },
});
```

### Step 3: Set Up TypeScript Types

Create `types/repond.ts`:

```typescript
import { todoStore } from "../stores/todo";

declare module "repond/declarations" {
  interface CustomRepondTypes {
    ItemTypeKeys: "todo";
    AllState: {
      todo: ReturnType<typeof todoStore.newState>;
    };
    AllRefs: {
      todo: ReturnType<typeof todoStore.newRefs>;
    };
  }
}
```

This gives you full autocomplete and type safety!

### Step 4: Create Your React Component

```typescript
import { useState } from "react";
import { addItem, setState, removeItem, useStore } from "repond";

function TodoList() {
  const [inputValue, setInputValue] = useState("");

  // Get all todos - re-renders when todos change
  const todoIds = useStore("todo", undefined, []);

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
        {Object.keys(todoIds).map((todoId) => (
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
  { changes: ["enemy.*.added"] } // Special syntax for additions
);
```

### Global Effects (Not Per-Item)

```typescript
makeEffect(
  () => {
    const allPlayers = getAllState("player");
    console.log("Total players:", Object.keys(allPlayers).length);
  },
  { changes: ["player.*.added", "player.*.removed"], isPerItem: false }
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

Ready to learn more? Check out the [Core Concepts Guide](./CORE_CONCEPTS.md)!
