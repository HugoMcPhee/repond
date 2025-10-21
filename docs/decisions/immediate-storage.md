# Decision: Immediate Effect Storage with Pending Tracking

**Date**: October 2025
**Status**: Implemented

---

## Context

We needed to fix React Strict Mode causing duplicate effect registration in hooks. The core problem:

1. React Strict Mode intentionally double-invokes effects (setup → cleanup → setup)
2. Effect registration was queued/batched for next frame
3. Cleanup ran synchronously
4. Result: Cleanup couldn't cancel effects because they hadn't been registered yet

**Original flow:**
```
Setup 1:   Queue effect registration
Cleanup:   Try to cancel effect (not found - still queued!)
Setup 2:   Queue effect registration again
Frame:     Both effects get registered → DUPLICATE
```

---

## Decision

Effects are now **stored immediately** in `liveEffectsMap`, while only the **indexing step** is queued.

```typescript
function _addEffect(effectDef) {
  // Immediate (synchronous)
  meta.liveEffectsMap.set(effectId, effectDef);
  meta.pendingEffectIndexIds.add(effectId);

  // Queued (asynchronous)
  queueEffectIndexing(effectId);
}

function _stopEffect(effectId) {
  // Immediate (synchronous)
  meta.liveEffectsMap.delete(effectId);
  meta.pendingEffectIndexIds.delete(effectId);

  // Cleanup happens in next frame
}
```

---

## Alternatives Considered

### Alternative 1: Track Queued Effects Separately
Keep queued effects in a separate "toAdd" queue.

**Rejected because:**
- Can't check if effect is registered (need to check two places)
- Can't cancel by ID (queue might have multiple effects)
- More complex state management
- Doesn't solve the core timing issue

---

### Alternative 2: Make All Registration Synchronous
Index effects immediately instead of queuing.

**Rejected because:**
- Breaks batching optimization
- Adding 100 effects would trigger 100 index updates
- Worse performance for effect groups
- Doesn't fit Repond's frame-based architecture

---

### Alternative 3: Block Strict Mode Cancellation
Ignore `stopEffect()` calls for recently added effects.

**Rejected because:**
- Breaks expected cleanup behavior
- Would leak effects if component truly unmounts
- Hacky workaround rather than proper fix
- Makes debugging harder

---

## Consequences

### Positive ✅

1. **Strict Mode Compatible**
   - Effects can be cancelled before indexing completes
   - No duplicate effects in React hooks
   - Works with React's intentional double-invocation

2. **Immediate Cancellation**
   - `stopEffect(id)` works synchronously
   - No race conditions with queued operations
   - Predictable cleanup behavior

3. **Effect Replacement Works**
   - Can detect duplicate IDs immediately
   - Update definition in place if pending
   - Stop and restart if already indexed

4. **Maintains Performance**
   - Indexing still batched (no regression)
   - O(1) storage/removal by ID
   - O(changed properties) discovery unchanged

### Negative ⚠️

1. **Two-State Tracking**
   - Need to track both `liveEffectsMap` and `pendingEffectIndexIds`
   - More complex mental model
   - Two lookups needed to determine full effect state

2. **Pending State Concept**
   - Effects exist in "pending" state between storage and indexing
   - Must be documented for developers to understand
   - Debugging requires checking both maps

3. **Slightly More Memory**
   - Extra Set for `pendingEffectIndexIds`
   - Minimal impact (just effect IDs, not full definitions)

---

## Implementation Notes

### Effect States

An effect can be in one of three states:

```typescript
// 1. Pending Registration
liveEffectsMap.has(id) === true
pendingEffectIndexIds.has(id) === true
// Stored but not indexed yet

// 2. Indexed (Active)
liveEffectsMap.has(id) === true
pendingEffectIndexIds.has(id) === false
// Stored and indexed, will run when properties change

// 3. Not Registered
liveEffectsMap.has(id) === false
pendingEffectIndexIds.has(id) === false
// Not in system
```

### Indexing Process

```typescript
// Called in next frame's update cycle
function indexPendingEffects() {
  for (const effectId of meta.pendingEffectIndexIds) {
    const effectDef = meta.liveEffectsMap.get(effectId);

    if (!effectDef) {
      // Effect was cancelled before indexing
      meta.pendingEffectIndexIds.delete(effectId);
      continue;
    }

    // Index by properties
    for (const propId of effectDef.changes) {
      meta.effectIdsByPhaseByStepByPropId[propId][step][phase].push(effectId);
    }

    // Remove from pending
    meta.pendingEffectIndexIds.delete(effectId);
  }
}
```

---

## Related Decisions

- [Stateless Callbacks](./stateless-callbacks.md) - Why callbacks look up from map
- [Warnings Default Off](./warnings-default-off.md) - Why replacement warnings are opt-in

---

## References

- [Effect System Architecture](../architecture/effect-system.md)
- [React Integration](../architecture/react-integration.md)
