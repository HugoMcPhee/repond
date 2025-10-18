# Repond - AI Agent Context

## Project Overview

**Repond** is a high-performance, entity-optimized state management library for JavaScript/TypeScript applications. It provides declarative reactive effects that automatically respond to state changes with O(1) complexity regardless of item count.

**Key Insight**: Repond only processes what changed, making it ideal for real-time applications with hundreds or thousands of entities.

---

## Core Concepts

### 1. Architecture: Items, State, and Effects

```
ItemType (Store)
  ├── Item 1 (Entity ID)
  │   ├── State (serializable)
  │   └── Refs (non-serializable)
  ├── Item 2
  │   ├── State
  │   └── Refs
  └── ...
```

**Three-layer hierarchy:**
- **ItemType**: Category of entities (e.g., "player", "enemy", "word")
- **Item**: Individual entity instance with unique ID
- **Properties**: State values within each item

### 2. State vs Refs

| Feature | State | Refs |
|---------|-------|------|
| **Persistence** | Serializable, can persist as JSON | Temporary, session-only |
| **Use Case** | Game data, user settings, positions | DOM refs, Three.js objects, callbacks |
| **Examples** | `{ x: 10, health: 100 }` | `{ meshRef: THREE.Mesh }` |

**Rule of thumb**: If it can be JSON.stringify'd, it belongs in state. Otherwise, use refs.

### 3. Effects System

Repond offers three approaches to effects:

#### A. Declarative Effects (Recommended for most use cases)
```typescript
const gameEffects = makeEffects((makeEffect) => ({
  updatePosition: makeEffect(
    (itemId) => {
      // React to position changes
      const pos = getState("player", itemId).position;
      updateRenderer(pos);
    },
    { changes: ["player.position"] }
  ),
}));

initEffectGroups({ gameEffects });
startEffectsGroup("gameEffects");
```

#### B. Imperative Effects (Runtime-decided, temporary)
```typescript
startNewEffect({
  id: "temporaryEffect",
  changes: ["enemy.health"],
  run: (itemId) => {
    if (getState("enemy", itemId).health <= 0) {
      removeItem("enemy", itemId);
    }
  },
});
```

#### C. Parameterized Effects (Dynamic, parameter-based)
```typescript
const characterEffects = makeParamEffects(
  { characterType: "player" },
  (makeEffect, params) => ({
    animate: makeEffect(/*...*/),
  })
);

startParamEffect("characterEffects", "animate", { characterType: "enemy" });
```

### 4. The Step System

Steps control **effect execution order**. Common pattern:

```typescript
"physics" → "gameLogic" → "rendering"
```

**Two phases per step:**
- `duringStep`: Runs in a loop until no changes (max 8 iterations)
- `endOfStep`: Runs once after duringStep completes

**Example:**
```typescript
makeEffect(runPhysics, {
  changes: ["player.velocity"],
  step: "physics",
  atStepEnd: false, // runs during step
});

makeEffect(renderScene, {
  changes: ["player.position"],
  step: "rendering",
  atStepEnd: true, // runs at end of rendering step
});
```

---

## Performance Characteristics

### Key Performance Features
- **O(1) complexity** for state updates (independent of total item count)
- **Automatic batching**: All setState calls batched until next frame
- **Selective updates**: Only processes changed items
- **Efficient diffing**: Tracks exactly what changed per frame

### Scale Guidelines
- **1,000s of items**: Excellent performance
- **10,000+ items**: Still performant (limited by RAM, not algorithm)
- **Bottleneck**: Not item count, but how much state changes per frame

**Example**: In a game with 10,000 entities, if only 5 move per frame, Repond only processes those 5.

---

## API Patterns

### Defining Stores

Store definitions use `newState` and `newRefs` functions. TypeScript infers types automatically:

```typescript
export const playerStore = {
  newState: () => ({
    position: { x: 0, y: 0 } as Position,
    health: 100,
    name: "" as string,
    isAlive: true,
  }),
  newRefs: () => ({
    sprite: null as THREE.Mesh | null,
  }),
};

// Then register with Repond
initRepond({
  storeNames: ["player", "enemy", "item"] as const,
  itemStores: { player: playerStore, enemy: enemyStore, item: itemStore },
});
```

### TypeScript Type Extension

Extend `CustomRepondTypes` for type safety:

```typescript
declare module "repond/declarations" {
  interface CustomRepondTypes {
    ItemTypeKeys: "player" | "enemy" | "item";
    AllState: {
      player: ReturnType<typeof playerStore.newState>;
      enemy: ReturnType<typeof enemyStore.newState>;
      item: ReturnType<typeof itemStore.newState>;
    };
    AllRefs: {
      player: ReturnType<typeof playerStore.newRefs>;
      enemy: ReturnType<typeof enemyStore.newRefs>;
      item: ReturnType<typeof itemStore.newRefs>;
    };
  }
}
```

### State Access Patterns

```typescript
// Get state (first item found)
const state = getState("player");

// Get state for specific item
const playerState = getState("player", "player1");

// Set state
setState("player", { health: 90 }, "player1");

// Add item
addItem("player", "player1");

// Remove item
removeItem("player", "player1");

// Get previous state (before last update)
const prevHealth = getPrevState("player", "player1").health;

// Get refs (non-serializable data)
const sprite = getRefs("player", "player1").sprite;
```

### React Integration

```typescript
import { useStore, useStoreItem, useStoreEffect } from "repond";

function PlayerComponent({ playerId }) {
  // Re-renders when player.health or player.position changes
  const player = useStore("player", playerId, ["health", "position"]);

  return <div>Health: {player.health}</div>;
}

function GameManager() {
  // Attach effect to component lifecycle
  useStoreEffect({
    changes: ["enemy.health"],
    run: (enemyId) => {
      const enemy = getState("enemy", enemyId);
      if (enemy.health <= 0) {
        removeItem("enemy", enemyId);
      }
    },
  });

  return <div>Game Running</div>;
}
```

---

## Common Patterns

### 1. Event-Driven Architecture

Repond excels in event systems where generic event handlers only need to set state:

```typescript
// Event system doesn't need app-specific knowledge
eventBus.on("player.damaged", (playerId, damage) => {
  setState("player", { health: getState("player", playerId).health - damage }, playerId);
});

// Effects handle the side effects automatically
makeEffect(
  (playerId) => {
    const player = getState("player", playerId);
    if (player.health <= 0) {
      triggerDeathAnimation(playerId);
      removeItem("player", playerId);
    }
  },
  { changes: ["player.health"] }
);
```

### 2. Drag & Drop with Animations

```typescript
const dragStore = {
  newState: () => ({
    position: { x: 0, y: 0 },
    targetPosition: { x: 0, y: 0 },
    isDragging: false,
  }),
  newRefs: () => ({
    element: null as HTMLElement | null,
  }),
};

// Effect animates position toward target
makeEffect(
  (itemId) => {
    const state = getState("draggable", itemId);
    const newPos = lerp(state.position, state.targetPosition, 0.1);
    setState("draggable", { position: newPos }, itemId);
  },
  { changes: ["draggable.targetPosition"], step: "animation" }
);
```

### 3. Avoiding Synchronous State Reads

Since setState is batched, use local variables within the same function:

```typescript
// ❌ Bad: getState won't reflect setState in same function
setState("player", { score: 100 });
console.log(getState("player").score); // May not be 100 yet

// ✅ Good: Use local variable
const newScore = 100;
setState("player", { score: newScore });
console.log(newScore); // Definitely 100
```

Or wait for next frame:

```typescript
setState("player", { score: 100 });

// In an effect or next frame callback:
makeEffect(
  () => {
    console.log(getState("player").score); // Now updated
  },
  { changes: ["player.score"] }
);
```

---

## Key Differentiators

### vs Redux
- **Performance**: No spread overhead on every frame
- **Simplicity**: No reducers, actions, or selectors
- **Type safety**: Automatic typed string access

### vs Zustand
- **Entity optimization**: Built-in handling for item collections
- **Effects system**: Declarative reactions to state changes
- **No imports needed**: Global typed access via strings

### vs MobX
- **Explicit**: Effects declared upfront, easier to debug
- **Performance**: Only processes changed items
- **Serialization**: State is always JSON-serializable

---

## File Structure Reference

### Core Files
- `src/index.ts` - Public API exports
- `src/types.ts` - TypeScript type definitions
- `src/meta.ts` - Centralized metadata store

### State Management
- `src/usable/create.ts` - `initRepond()` initialization
- `src/usable/getSet.ts` - `setState()`, `getState()`, `addItem()`, `removeItem()`

### Effects System
- `src/usable/effects.ts` - `startEffect()`, `stopEffect()`, `makeEffects()`
- `src/usable/paramEffects.ts` - Parameterized effects
- `src/helpers/effects.ts` - Internal effect execution

### React Integration
- `src/usable/hooks.ts` - `useStore()`, `useStoreEffect()`, `useStoreItem()`

### Update System
- `src/updating.ts` - Frame orchestration and batching
- `src/getStatesDiff.ts` - Diff calculation
- `src/checkEffects.ts` - Effect matching logic

---

## Common Gotchas

### 1. Effect Infinite Loops
If an effect modifies the same state it watches, it can loop:

```typescript
// ❌ Infinite loop: effect triggers itself
makeEffect(
  (id) => {
    setState("player", { x: getState("player", id).x + 1 }, id);
  },
  { changes: ["player.x"] }
);
```

**Solution**: Use different properties or add loop detection logic.

### 2. TypeScript Type Inference

Store definitions need explicit `as` casts for type inference:

```typescript
// ✅ Good: Types inferred correctly
newState: () => ({
  name: "" as string,
  count: 0 as number,
})

// ❌ Bad: Types inferred as literal values
newState: () => ({
  name: "",  // Type: ""
  count: 0,  // Type: 0
})
```

### 3. Frame Timing

State updates are batched per frame. For time-sensitive operations, understand the frame cycle:

```
setState() called → Batched → Next frame → Effects run → React re-renders
```

---

## Development Guidelines

### When Adding Features
1. **Maintain serialization**: State must always be JSON-serializable
2. **Performance first**: Ensure O(1) complexity for item operations
3. **Type safety**: Leverage TypeScript's inference, avoid `any`
4. **Test with scale**: Verify performance with 1000+ items

### When Writing Effects
1. **Specific changes**: Only watch properties you need
2. **Idempotent**: Effects should handle being called multiple times
3. **Step order**: Consider physics → logic → rendering order
4. **Avoid loops**: Don't modify what you watch (or add guards)

### Code Style
- **Functional**: Prefer pure functions
- **Immutable**: State is immutable; use `setState()` for changes
- **Typed strings**: Use autocompleted prop paths (e.g., `"player.health"`)

---

## Testing Approach

### Unit Testing Stores
```typescript
import { initRepond, addItem, setState, getState } from "repond";

describe("playerStore", () => {
  beforeEach(() => {
    initRepond({ storeNames: ["player"], itemStores: { player: playerStore } });
  });

  it("should initialize with default values", () => {
    addItem("player", "p1");
    expect(getState("player", "p1").health).toBe(100);
  });

  it("should update state", () => {
    addItem("player", "p1");
    setState("player", { health: 50 }, "p1");
    expect(getState("player", "p1").health).toBe(50);
  });
});
```

### Testing Effects
```typescript
it("should trigger effect on state change", (done) => {
  let effectCalled = false;

  startNewEffect({
    id: "testEffect",
    changes: ["player.health"],
    run: () => {
      effectCalled = true;
      done();
    },
  });

  addItem("player", "p1");
  setState("player", { health: 50 }, "p1");

  // Wait for next frame
  setTimeout(() => {
    expect(effectCalled).toBe(true);
  }, 20);
});
```

---

## Quick Reference Commands

```typescript
// Initialize
initRepond({ storeNames, itemStores });

// State operations
getState(itemType, itemId?);
setState(itemType, patch, itemId);
addItem(itemType, itemId);
removeItem(itemType, itemId);
getPrevState(itemType, itemId);

// Refs
getRefs(itemType, itemId);

// Effects
makeEffects((makeEffect) => ({ /* ... */ }));
initEffectGroups({ groupName: effects });
startEffectsGroup(groupName);
stopEffectsGroup(groupName);
startNewEffect({ id, changes, run });
stopEffect(id);

// React hooks
useStore(itemType, itemId, propertyNames);
useStoreItem(itemType, itemId);
useStoreEffect({ changes, run });

// Utilities
getPatch(diffInfo);
applyPatch(patch);
combineDiffs(diff1, diff2);
getItemWillExist(itemType, itemId);
```

---

## Philosophy

Repond's design philosophy:
1. **Respond, don't command**: Declare what should happen when state changes
2. **Optimize for entities**: Built-in handling for item collections
3. **Type-safe simplicity**: No store imports, just typed strings
4. **Framework agnostic**: Core is independent, React hooks are optional
5. **Serialization first**: State is always persistable
6. **Performance by default**: O(1) updates regardless of scale

---

## Useful Context for AI Agents

- **No README yet**: Documentation is minimal, refer to this file
- **Type inference is key**: Store definitions drive all TypeScript types
- **Effect order matters**: Use steps to control execution sequence
- **Batching is automatic**: Don't try to force synchronous updates
- **Scale is not a concern**: Focus on state change frequency, not item count
- **Serialization boundary**: State = JSON, Refs = everything else

When helping users:
1. Emphasize the entity-centric approach
2. Guide toward declarative effects over imperative
3. Remind about automatic batching
4. Highlight the O(1) performance characteristics
5. Suggest step system for complex effect orchestration
