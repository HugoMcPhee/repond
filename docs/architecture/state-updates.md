# State Updates and Batching

How Repond's frame-based update cycle works and why it achieves O(changed items) performance.

---

## Core Concept: Frame-Based Batching

Repond batches all state changes and processes them together in the next frame:

```typescript
// User code (synchronous)
setState("player", { x: 10 }, "player1");
setState("player", { y: 20 }, "player1");
setState("enemy", { health: 50 }, "enemy1");

// All batched together...

// Next frame (asynchronous)
// 1. Calculate what changed
// 2. Run matching effects
// 3. React components re-render
```

**Key Insight**: No matter how many `setState` calls happen in the same frame, Repond only processes the diff once.

---

## Update Cycle Phases

### Phase 1: Waiting for First Update
**State**: `meta.phase = "waitingForFirstUpdate"`

- Initial state after `initRepond()`
- No update scheduled yet
- Collecting state changes in `nowState`

**Transition**: First `setState()` call → Schedule update → Move to next phase

---

### Phase 2: Waiting to Run Effects
**State**: `meta.phase = "waitingToRunEffects"`

- Update scheduled for next frame
- Collecting more state changes
- Recording which items/props were modified in `recordedChanges`

**Transition**: Next frame begins → Move to "runningEffects"

---

### Phase 3: Running Effects
**State**: `meta.phase = "runningEffects"`

- Calculate diff between `nowState` and `prevState`
- Run effects in step order
- Effects may trigger more `setState()` calls
- Process multiple step iterations if needed

**Transition**: All steps complete → Move back to "waitingForFirstUpdate"

---

## The Step System

Steps control **effect execution order**:

```typescript
initRepond(stores, ["physics", "gameLogic", "rendering"]);
```

Effects specify which step they belong to:

```typescript
makeEffect(
  (playerId) => { /* ... */ },
  {
    changes: ["player.velocity"],
    step: "physics",      // Run in physics step
    atStepEnd: false      // Run during step (not at end)
  }
)
```

---

### Step Execution: During vs End

Each step has **two phases**:

#### 1. During Step (Loop Until Stable)
**`atStepEnd: false`**

```typescript
let iteration = 0;
do {
  runEffects(step, "duringStep");
  iteration++;
} while (stateChanged && iteration < MAX_ITERATIONS);
```

**Behavior**:
- Runs in a loop
- Continues if effects modify state
- Max 8 iterations (prevents infinite loops)
- Use for: Physics calculations, game logic that might trigger more changes

**Example**:
```typescript
// Collision detection might trigger position changes
makeEffect(detectCollisions, {
  changes: ["player.position"],
  step: "physics",
  atStepEnd: false  // Loop until no more collisions
});
```

---

#### 2. End of Step (Run Once)
**`atStepEnd: true`**

```typescript
runEffects(step, "endOfStep");
// Runs exactly once, does not loop
```

**Behavior**:
- Runs once after "during step" completes
- Does NOT loop even if it modifies state
- Use for: Rendering, logging, side effects

**Example**:
```typescript
// Render scene after all physics settled
makeEffect(renderScene, {
  changes: ["player.position"],
  step: "rendering",
  atStepEnd: true  // Run once after everything settled
});
```

---

### Complete Step Flow

```
┌─── Step: "physics" ───────────────────────┐
│                                            │
│  During Step (loops):                      │
│  ├─> Run physics effects                   │
│  ├─> Check if state changed                │
│  └─> Loop if changed (max 8 times)         │
│                                            │
│  End of Step (once):                       │
│  └─> Run end-of-step physics effects       │
│                                            │
└────────────────────────────────────────────┘
                     ↓
┌─── Step: "gameLogic" ──────────────────────┐
│  During Step → End of Step                 │
└────────────────────────────────────────────┘
                     ↓
┌─── Step: "rendering" ──────────────────────┐
│  During Step → End of Step                 │
└────────────────────────────────────────────┘
```

---

## Performance Characteristics

### O(Changed Items), Not O(Total Items)

Repond's performance scales with **what changed**, not total item count.

#### Example: 10,000 Enemies, 5 Move

```typescript
// 10,000 enemies exist
for (let i = 0; i < 10000; i++) {
  addItem("enemy", `enemy${i}`);
}

// Only 5 move this frame
for (let i = 0; i < 5; i++) {
  setState("enemy", { x: newX, y: newY }, `enemy${i}`);
}
```

**Processing cost**:
- Calculate diff: O(5 items × 2 properties) = O(10 operations)
- Find effects: O(2 properties × effects watching those properties)
- Run effects: O(5 items × effect complexity)

**NOT**: O(10,000) operations!

---

### Why This Works: Recorded Changes

```typescript
// When setState is called
setState("player", { x: 10 }, "player1");

// Repond records what changed
recordedChanges.itemIds.add("player1");
recordedChanges.propIds.add("player.x");
```

**Diff calculation** only checks recorded items:

```typescript
function getStatesDiff(nowState, prevState, recordedChanges) {
  // Only loop over items that were modified
  for (const itemId of recordedChanges.itemIds) {
    // Only check properties that were set
    for (const propId of recordedChanges.propIds) {
      if (nowState[itemId][prop] !== prevState[itemId][prop]) {
        diffInfo.add(itemId, prop);
      }
    }
  }
}
```

**Result**: Diff cost = O(changed items × changed properties)

---

### Performance Breakdown

#### setState() - O(1)
```typescript
setState("player", { health: 90 }, "player1");

// Direct assignment, no spread
nowState.player.player1.health = 90;

// Record change
recordedChanges.itemIds.add("player1");
recordedChanges.propIds.add("player.health");

// Schedule update (if not already scheduled)
updateRepondNextFrame();
```

**No copying**, no spreading - just direct mutation internally.

---

#### Diff Calculation - O(Changed Items × Changed Properties)
```typescript
// With 100 items, 5 changed, 2 properties each
// Cost: 5 × 2 = 10 comparisons
// NOT: 100 × all properties comparisons
```

---

#### Effect Discovery - O(Changed Properties × Effects Per Property)
```typescript
// Changed properties: ["player.x", "player.y"]
// Effects watching player.x: 3 effects
// Effects watching player.y: 2 effects (1 overlaps)

// Cost: Look up 2 properties, deduplicate 4 unique effects
// NOT: Check all effects in system
```

---

#### Effect Execution - O(Effects × Complexity)
```typescript
// Only run effects that watch changed properties
// If 4 effects need to run, run those 4
// NOT: Run all effects
```

---

## Batching Behavior

### Multiple setState Calls

```typescript
// All in same synchronous block
setState("player", { x: 10 }, "player1");
setState("player", { y: 20 }, "player1");
setState("player", { x: 15 }, "player1");  // Overwrites x

// Result in next frame:
// player1.x = 15  (latest value)
// player1.y = 20
```

**Batching rules**:
- Last write wins for same property
- All changes processed together in next frame
- Only one diff calculation
- Effects run once per affected item

---

### Reading After Writing

```typescript
// ❌ GOTCHA: getState doesn't see batched changes yet
setState("player", { score: 100 }, "player1");
const score = getState("player", "player1").score;
console.log(score);  // Might not be 100 yet!
```

**Why**: setState writes to `nowState`, but getState might read from a cached version or before the write is flushed.

**Solutions**:

```typescript
// ✅ Solution 1: Use local variable
const newScore = 100;
setState("player", { score: newScore }, "player1");
console.log(newScore);  // Definitely 100

// ✅ Solution 2: Read in an effect (next frame)
setState("player", { score: 100 }, "player1");

useStoreEffect({
  changes: ["player.score"],
  run: (playerId) => {
    const score = getState("player", playerId).score;
    console.log(score);  // Now updated
  }
});
```

---

## State Copying and Comparison

### Three State Copies

```typescript
// meta.nowState - Current state (being modified)
// meta.prevState - Previous frame's state (for diff)
// meta.copyState - Backup for potential reversal
```

**During update cycle**:

```typescript
// 1. Before running effects: Copy current to previous
copyStates(meta.nowState, meta.prevState);

// 2. Calculate diff
getStatesDiff(meta.nowState, meta.prevState, diffInfo);

// 3. Run effects (may modify nowState)
runEffects();

// 4. Next frame: prevState now has old values for next diff
```

**Memory cost**: 3× state size, but only stores actual items (not max capacity)

---

### Diff Information Structure

```typescript
type DiffInfo = {
  itemIdsByItemType: Record<ItemType, Set<ItemId>>,
  propIdsByItemId: Record<ItemId, Set<PropId>>,
  // Quick lookup: Which items of type "player" changed?
  // Quick lookup: Which properties of "player1" changed?
}
```

**Used by**:
- Effect discovery (which effects should run?)
- React hook updates (which components should re-render?)
- Developer tools (what changed this frame?)

---

## Infinite Loop Protection

```typescript
const MAX_STEP_ITERATIONS = 8;

let iteration = 0;
do {
  runDuringStepEffects();
  iteration++;

  if (iteration >= MAX_STEP_ITERATIONS) {
    warn("Possible infinite loop: step ran 8 times");
    break;
  }
} while (stateChangedDuringEffects);
```

**Common causes**:
- Effect modifies property it watches
- Circular effect dependencies (A triggers B triggers A)
- Physics calculations that don't converge

**Solutions**:
- Use `atStepEnd: true` for non-looping effects
- Add convergence conditions
- Move to different steps to break cycles

---

## Common Patterns

### Pattern 1: Physics → Rendering

```typescript
const effects = makeEffects((makeEffect) => ({
  // Physics runs first, loops until stable
  applyVelocity: makeEffect(
    (playerId) => {
      const player = getState("player", playerId);
      setState("player", {
        x: player.x + player.vx,
        y: player.y + player.vy,
      }, playerId);
    },
    { changes: ["player.velocity"], step: "physics", atStepEnd: false }
  ),

  // Rendering runs last, once
  updateSprite: makeEffect(
    (playerId) => {
      const player = getState("player", playerId);
      const sprite = getRefs("player", playerId).sprite;
      sprite.position.set(player.x, player.y);
    },
    { changes: ["player.position"], step: "rendering", atStepEnd: true }
  ),
}));
```

**Result**: Physics settles, then rendering happens once with final positions.

---

### Pattern 2: Event-Driven Updates

```typescript
// Event handlers just set state
button.onClick = () => {
  setState("player", { health: getState("player", "p1").health - 10 }, "p1");
};

// Effects handle side effects
makeEffect(
  (playerId) => {
    const health = getState("player", playerId).health;
    if (health <= 0) {
      triggerGameOver();
    }
  },
  { changes: ["player.health"] }
);
```

**Benefit**: Event handlers stay generic, effects contain game-specific logic.

---

### Pattern 3: Derived State

```typescript
// Update derived values in effects
makeEffect(
  (playerId) => {
    const { x, y } = getState("player", playerId);
    const distance = Math.sqrt(x * x + y * y);
    setState("player", { distanceFromOrigin: distance }, playerId);
  },
  { changes: ["player.x", "player.y"], step: "gameLogic", atStepEnd: false }
);
```

**Note**: This runs during step, so if other effects depend on `distanceFromOrigin`, they'll see updated value in same frame.

---

## Debugging Updates

### Enable Warnings

```typescript
initRepond(stores, steps, { enableWarnings: true });
```

Watch for:
- "Too many step iterations" - Possible infinite loop
- "Effect has no item types" - Effect watching non-existent properties

---

### Log Diff Info

```typescript
makeEffect(
  (itemId, diffInfo) => {
    console.log("Changes this frame:", diffInfo);
  },
  { changes: ["player.*"], step: "default", atStepEnd: true }
);
```

**diffInfo parameter** shows exactly what changed that triggered this effect.

---

### Monitor Frame Timing

```typescript
makeEffect(
  (itemId, diffInfo, frameDuration) => {
    console.log("Frame took", frameDuration, "ms");
  },
  { changes: ["player.*"], step: "rendering", atStepEnd: true }
);
```

**frameDuration parameter** helps identify performance bottlenecks.

---

## Performance Tips

### ✅ Batch state changes in same frame
```typescript
// Good: Both batched together
setState("player", { x: 10 }, "p1");
setState("player", { y: 20 }, "p1");
```

### ✅ Use specific properties in effects
```typescript
// Good: Only runs when health changes
makeEffect(run, { changes: ["player.health"] });

// Bad: Runs when ANY property changes
makeEffect(run, { changes: ["player.*"] });
```

### ✅ Use atStepEnd for non-looping work
```typescript
// Good: Rendering doesn't need to loop
makeEffect(render, { step: "rendering", atStepEnd: true });
```

### ❌ Avoid reading state immediately after setState
```typescript
// Bad: Might not see change yet
setState("player", { x: 10 }, "p1");
const x = getState("player", "p1").x;  // Race condition
```

### ❌ Avoid effects that watch what they modify
```typescript
// Bad: Infinite loop risk
makeEffect(
  (id) => {
    const x = getState("player", id).x;
    setState("player", { x: x + 1 }, id);  // Triggers itself!
  },
  { changes: ["player.x"] }
);
```

---

## Related Documents

- [Effect System](./effect-system.md) - How effects are stored and indexed
- [React Integration](./react-integration.md) - How hooks integrate with update cycle
