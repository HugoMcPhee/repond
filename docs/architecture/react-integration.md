# React Integration Architecture

How Repond's React hooks work and integrate with React's lifecycle, including Strict Mode compatibility.

---

## Core Challenge: React Strict Mode

React Strict Mode intentionally **double-invokes effects** in development to help detect bugs:

```typescript
useEffect(() => {
  console.log("Setup");    // Called twice in strict mode
  return () => {
    console.log("Cleanup"); // Called between invocations
  };
});

// Output in strict mode:
// Setup
// Cleanup
// Setup
```

This creates a challenge for state management libraries: how do you avoid duplicate subscriptions?

---

## The Stable ID Solution

All Repond hooks use `useRef` to generate **stable effect IDs** per component instance:

### Pattern
```typescript
function useStoreEffect(options: EffectOptions) {
  const effectIdRef = useRef<string>();

  // Generate ID once, reuse on re-renders
  if (!effectIdRef.current) {
    effectIdRef.current = options.id ??
      toSafeEffectId("useStoreEffect_" + JSON.stringify(options.changes));
  }

  useEffect(() => {
    // Setup: Register effect with stable ID
    startEffect(effectIdRef.current, options);

    return () => {
      // Cleanup: Remove effect by stable ID
      stopEffect(effectIdRef.current);
    };
  }, [/* dependencies */]);
}
```

### Why This Works

**First Invocation:**
1. Setup runs: `startEffect("stable-id-123")`
2. Effect stored in `liveEffectsMap`, added to `pendingEffectIndexIds`

**Strict Mode Cleanup:**
3. Cleanup runs: `stopEffect("stable-id-123")`
4. Effect removed from `liveEffectsMap` and `pendingEffectIndexIds`

**Second Invocation:**
5. Setup runs: `startEffect("stable-id-123")` (SAME ID!)
6. Effect stored again, added to pending

**Result**: Only one effect registered, no duplicates!

**Without stable IDs**: Each invocation would get a new ID (e.g., "effect-1", "effect-2"), causing both to register.

---

## Immediate Storage Enables This

The stable ID solution only works because Repond uses **immediate storage**:

```typescript
function _addEffect(effectDef) {
  // Store immediately (synchronous)
  meta.liveEffectsMap.set(effectId, effectDef);
  meta.pendingEffectIndexIds.add(effectId);

  // Index later (queued for next frame)
  queueEffectIndexing(effectId);
}

function _stopEffect(effectId) {
  // Remove immediately (synchronous)
  meta.liveEffectsMap.delete(effectId);
  meta.pendingEffectIndexIds.delete(effectId);

  // Cleanup index later (queued)
  queueEffectCleanup(effectId);
}
```

**Why this matters**:
- Cleanup in strict mode is synchronous
- If storage was queued, cleanup wouldn't see the effect yet
- Immediate storage means cleanup can cancel pending effects

---

## The Three Hooks

### 1. useStoreEffect

**Purpose**: Attach an effect to component lifecycle.

**ID Generation**:
```typescript
const effectId = options.id ??
  toSafeEffectId("useStoreEffect_" + JSON.stringify(options.changes));
```

**Use Case**:
```typescript
useStoreEffect({
  changes: ["player.health"],
  run: (playerId) => {
    const health = getState("player", playerId).health;
    if (health <= 0) {
      showGameOver();
    }
  }
});
```

**Lifecycle**:
- Component mounts → Effect starts
- Component unmounts → Effect stops
- Strict mode → No duplicates (stable ID)

---

### 2. useStoreItem

**Purpose**: Subscribe to an entire item's state, re-render on any change.

**ID Generation**:
```typescript
const effectId = toSafeEffectId("useStoreItem_" + itemId);
```

**Use Case**:
```typescript
function EnemyCard({ enemyId }) {
  const enemy = useStoreItem("enemy", enemyId);

  return (
    <div>
      <p>Health: {enemy.health}</p>
      <p>Position: {enemy.x}, {enemy.y}</p>
    </div>
  );
}
```

**How it works**:
1. Creates effect watching `enemy.*` (all properties)
2. Effect callback calls `forceUpdate()` to re-render
3. Returns current state from `getState()`

**Re-render timing**: Next frame after state change (batched)

---

### 3. useStore

**Purpose**: Subscribe to specific properties of an item, re-render when they change.

**ID Generation**:
```typescript
const effectId = options.id ?? toSafeEffectId("reactComponent");
```

**Use Case**:
```typescript
function PlayerHealth({ playerId }) {
  // Only re-renders when health changes, not position/etc
  const player = useStore("player", playerId, ["health"]);

  return <div>Health: {player.health}</div>;
}
```

**Optimization**: Only watches specified properties, reducing unnecessary re-renders.

**Note**: Default ID is less specific ("reactComponent") - consider passing custom ID if using multiple times in same component.

---

## Strict Mode Flow Diagram

```
Component Renders (1st time in strict mode)
│
├─> useRef creates stable ID: "effect-abc123"
│
└─> useEffect setup runs
    ├─> startEffect("effect-abc123")
    ├─> Stored in liveEffectsMap
    └─> Added to pendingEffectIndexIds

Strict Mode Cleanup (intentional)
│
└─> useEffect cleanup runs
    ├─> stopEffect("effect-abc123")
    ├─> Removed from liveEffectsMap
    └─> Removed from pendingEffectIndexIds

Component "Re-renders" (2nd time in strict mode)
│
├─> useRef returns SAME ID: "effect-abc123"
│
└─> useEffect setup runs AGAIN
    ├─> startEffect("effect-abc123")  ← Same ID!
    ├─> Stored in liveEffectsMap (again)
    └─> Added to pendingEffectIndexIds (again)

Next Frame: Indexing
│
└─> Process pendingEffectIndexIds
    ├─> Index effect in effectIdsByPhaseByStepByPropId
    └─> Clear from pendingEffectIndexIds

Result: ONE effect registered ✅
```

---

## Common Patterns

### Pattern 1: Effect with Custom ID

```typescript
useStoreEffect({
  id: "player-health-monitor",  // Explicit ID
  changes: ["player.health"],
  run: (playerId) => { /* ... */ }
});
```

**When to use**: When you need a specific, debuggable effect name.

---

### Pattern 2: Multiple Effects in One Component

```typescript
function GameManager() {
  // Use custom IDs to avoid conflicts
  useStoreEffect({
    id: "game-health-check",
    changes: ["player.health"],
    run: (playerId) => { /* ... */ }
  });

  useStoreEffect({
    id: "game-score-update",
    changes: ["player.score"],
    run: (playerId) => { /* ... */ }
  });

  return <div>Game Running</div>;
}
```

**Why custom IDs**: Default ID generation might create conflicts.

---

### Pattern 3: Conditional Effects

```typescript
function PlayerCard({ playerId, showHealthBar }) {
  useStoreEffect({
    changes: showHealthBar ? ["player.health"] : [],
    run: (id) => {
      if (showHealthBar) {
        updateHealthBar(id);
      }
    }
  });
}
```

**Note**: Effect still registers even with empty `changes` array. Consider conditional rendering or `useEffect` dependencies to truly conditionally register.

---

### Pattern 4: Access Item IDs in Component

```typescript
function PlayerList() {
  const [playerIds, setPlayerIds] = useState<string[]>([]);

  // Update list when players are added/removed
  useStoreEffect({
    changes: ["player.__added", "player.__removed"],
    run: () => {
      setPlayerIds(getItemIds("player"));
    }
  });

  return (
    <div>
      {playerIds.map(id => (
        <PlayerCard key={id} playerId={id} />
      ))}
    </div>
  );
}
```

**Key**: Use special `__added` and `__removed` change keys to track item lifecycle.

---

## Performance Considerations

### Re-render Frequency

**useStoreItem**: Re-renders on ANY property change
```typescript
const enemy = useStoreItem("enemy", enemyId);
// Re-renders when health, position, name, etc. change
```

**useStore**: Re-renders only on specified properties
```typescript
const enemy = useStore("enemy", enemyId, ["health"]);
// Only re-renders when health changes
```

**Recommendation**: Use `useStore` with specific properties for better performance.

---

### Effect Cleanup Cost

```typescript
useStoreEffect({
  changes: ["player.position"],
  run: expensiveCalculation
});
```

**Cost per unmount**:
- Remove from `liveEffectsMap`: O(1)
- Remove from `pendingEffectIndexIds`: O(1) if pending
- Remove from property indexes: O(properties watched)

**Optimization**: Effects watching fewer properties clean up faster.

---

## Debugging Hooks

### Check if Effect is Registered

```typescript
useStoreEffect({
  id: "my-debug-effect",
  changes: ["player.health"],
  run: (playerId) => {
    console.log("Effect running for", playerId);
  }
});

// In browser console:
// Check storage (after component mounts)
meta.liveEffectsMap.has("my-debug-effect"); // true if registered

// Check pending status
meta.pendingEffectIndexIds.has("my-debug-effect"); // true if not yet indexed
```

---

### Enable Warnings

```typescript
initRepond(stores, steps, { enableWarnings: true });
```

Watch for:
- "Replacing effect: [id] (pending)" - Hook re-registering before indexing
- "Replacing effect: [id] (indexed)" - Hook re-registering after indexing (unusual in strict mode)

---

## Gotchas and Solutions

### Gotcha 1: Stale Closures

```typescript
// ❌ Captures stale value
const [count, setCount] = useState(0);

useStoreEffect({
  changes: ["player.score"],
  run: () => {
    console.log(count); // Always logs 0 (stale)
  }
});
```

**Solution**: Use dependencies or pass via refs
```typescript
// ✅ Use ref for latest value
const countRef = useRef(count);
countRef.current = count;

useStoreEffect({
  changes: ["player.score"],
  run: () => {
    console.log(countRef.current); // Always current
  }
});
```

---

### Gotcha 2: Effect Not Running

```typescript
// Changes not detected?
useStoreEffect({
  changes: ["player.position"],
  run: (playerId) => {
    console.log("Never runs?");
  }
});
```

**Check**:
1. Is `initRepond()` called before component renders?
2. Is effect group started (if using `makeEffects`)?
3. Is the property path correct? (Check with warnings enabled)
4. Is state actually changing? (`setState` batches, might not trigger if value is same)

---

### Gotcha 3: Multiple Re-renders

```typescript
// Effect triggers setState, causing re-render loop
useStoreEffect({
  changes: ["player.x"],
  run: (playerId) => {
    // ❌ This causes infinite loop
    setState("player", { x: getState("player", playerId).x + 1 }, playerId);
  }
});
```

**Solution**: Don't modify what you're watching, or add conditions
```typescript
useStoreEffect({
  changes: ["player.x"],
  run: (playerId) => {
    const x = getState("player", playerId).x;
    // ✅ Only update if condition met
    if (x < 100) {
      setState("player", { x: x + 1 }, playerId);
    }
  }
});
```

---

## Related Documents

- [Effect System](./effect-system.md) - How the underlying effect system works
- [Immediate Storage Decision](../decisions/immediate-storage.md) - Why effects are stored immediately
- [Stateless Callbacks Decision](../decisions/stateless-callbacks.md) - Why callbacks look up from map
