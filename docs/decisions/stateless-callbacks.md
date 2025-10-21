# Decision: Stateless Effect Callbacks

**Date**: October 2025
**Status**: Implemented

---

## Context

With immediate storage and effect replacement support, we needed callbacks to execute the **latest** effect definition, not a stale closure.

**Problem scenario:**
```typescript
// Effect registered
const effectDef1 = { run: () => console.log("v1"), changes: ["player.x"] };
startEffect("myEffect", effectDef1);

// Callback created (closure over effectDef1)
const callback = () => effectDef1.run();  // ❌ Closes over v1

// Effect replaced
const effectDef2 = { run: () => console.log("v2"), changes: ["player.x"] };
startEffect("myEffect", effectDef2);

// Callback still runs v1!
callback();  // Logs "v1" instead of "v2"
```

---

## Decision

Callbacks are now **stateless** - they look up the current effect definition from `liveEffectsMap` instead of closing over variables.

```typescript
// ❌ OLD: Stateful (closes over effectDef)
const callback = () => {
  runEffect(effectDef);  // Uses captured definition
};

// ✅ NEW: Stateless (looks up current definition)
const callback = () => {
  const currentDef = meta.liveEffectsMap.get(effectId);
  if (currentDef) {
    runEffect(currentDef);  // Always uses latest
  }
};
```

---

## Alternatives Considered

### Alternative 1: Cancel and Recreate Callbacks
When effect is replaced, cancel old callback and create new one.

**Rejected because:**
- Requires tracking all callbacks for each effect
- Need to cancel/recreate queued operations
- More complex cleanup logic
- Breaks if callbacks are scheduled in multiple places

---

### Alternative 2: Prevent Effect Replacement
Don't allow duplicate effect IDs, throw error instead.

**Rejected because:**
- Breaks React Strict Mode (intentional duplicate IDs)
- Less flexible for dynamic effects
- Worse developer experience
- Doesn't match user expectations

---

### Alternative 3: Mutable Effect Definitions
Mutate the effect definition in place instead of replacing.

**Rejected because:**
- Need to deep-compare changes array to see if reindexing needed
- Less clear ownership model
- Harder to debug (silent mutations)
- TypeScript type safety issues

---

## Consequences

### Positive ✅

1. **Effect Replacement Works**
   - Callbacks always execute latest definition
   - No stale closure bugs
   - Replacement is transparent to queued operations

2. **Simpler State Management**
   - Single source of truth (`liveEffectsMap`)
   - No need to track callback references
   - Cleanup is straightforward (just delete from map)

3. **Predictable Behavior**
   - Effect updates take effect immediately
   - Easy to reason about: "What's in the map is what runs"
   - Clear contract for effect definitions

4. **React Strict Mode Compatible**
   - Hooks can replace effects safely
   - Updated definitions execute on retry
   - No duplicate effect logic

### Negative ⚠️

1. **Extra Map Lookup**
   - Every callback does `liveEffectsMap.get(effectId)`
   - Minimal performance impact (Map lookup is O(1))
   - Happens once per effect per frame

2. **Indirect Execution**
   - Callback doesn't directly hold the function
   - Slightly harder to debug (extra indirection)
   - Stack traces show lookup code

3. **Null Checks Required**
   - Must check if effect still exists
   - Possible (rare) case where callback runs after effect removed
   - Need conditional execution

---

## Implementation Notes

### Pattern Applied To

This pattern is used in multiple places:

#### 1. Effect Indexing Callbacks
```typescript
// Queued operation for indexing
const callback = () => {
  const effectDef = meta.liveEffectsMap.get(effectId);
  if (!effectDef) return;  // Effect was cancelled

  indexEffect(effectDef);
  meta.pendingEffectIndexIds.delete(effectId);
};
```

#### 2. Effect Cleanup Callbacks
```typescript
// Queued operation for cleanup
const callback = () => {
  const effectDef = meta.liveEffectsMap.get(effectId);
  if (!effectDef) return;  // Already cleaned up

  removeFromPropertyIndexes(effectDef);
};
```

#### 3. Effect Execution (Indirect)
```typescript
// checkEffects looks up from liveEffectsMap
function checkEffects(diffInfo) {
  for (const effectId of effectsToRun) {
    const effectDef = meta.liveEffectsMap.get(effectId);
    if (!effectDef) continue;  // Effect removed mid-frame

    effectDef.run(itemId, diffInfo, frameDuration);
  }
}
```

---

## Trade-offs Analysis

### Memory: Minimal Impact
- **Without stateless**: Close over effect def (~1KB per effect)
- **With stateless**: Store effect ID string (~10 bytes per callback)
- **Savings**: ~99% less memory per callback

### Performance: Negligible Cost
- **Lookup cost**: O(1) Map.get() - typically <1μs
- **Frequency**: Once per effect per frame
- **Impact**: Negligible compared to effect execution time

### Code Clarity: Slightly More Complex
- **Before**: Direct function call
- **After**: Lookup → null check → function call
- **Benefit**: Explicit about indirection, easier to debug replacements

**Verdict**: Performance cost is negligible, benefits far outweigh costs.

---

## Usage Guidelines

### When Creating Callbacks

Always look up from `liveEffectsMap`:

```typescript
// ✅ Correct
const callback = () => {
  const effectDef = meta.liveEffectsMap.get(effectId);
  if (!effectDef) return;
  // Use effectDef
};

// ❌ Incorrect
const callback = () => {
  // Uses closed-over effectDef
  effectDef.run();
};
```

### Why Null Check Matters

```typescript
// Scenario: Effect cancelled mid-frame
startEffect("myEffect", { run, changes });
// Indexing callback queued...

stopEffect("myEffect");
// Effect removed from liveEffectsMap

// Next frame: Indexing callback runs
const effectDef = meta.liveEffectsMap.get("myEffect");
// Returns undefined - effect was cancelled!

if (!effectDef) return;  // Essential!
```

---

## Related Decisions

- [Immediate Storage](./immediate-storage.md) - Why effects are stored in liveEffectsMap immediately
- [Warnings Default Off](./warnings-default-off.md) - Why replacement warnings are configurable

---

## References

- [Effect System Architecture](../architecture/effect-system.md)
- Implementation: [src/helpers/effects.ts](../../src/helpers/effects.ts)
