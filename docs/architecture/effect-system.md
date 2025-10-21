# Effect System Architecture

This document explains how Repond's effect system works internally and why it's designed this way.

---

## Core Concept: Two-Tier Storage

Effects in Repond use a **two-tier storage system** for optimal performance:

### 1. Storage Layer: `liveEffectsMap`
- **Purpose**: Stores the actual effect definitions
- **Structure**: `Map<effectId, EffectDef>`
- **When updated**: Immediately when effect is added/removed
- **Why**: Fast lookup by ID, enables immediate cancellation

### 2. Discovery Layer: `effectIdsByPhaseByStepByPropId`
- **Purpose**: Indexes effects by what properties they watch
- **Structure**: `Record<propId, Record<step, Record<phase, effectId[]>>>`
- **When updated**: Queued for next frame (during update cycle)
- **Why**: Only process effects that watch changed properties

### Why Two Tiers?

**Problem**: If we only indexed effects by property, we couldn't cancel them quickly (would need to search all properties).

**Solution**: Store effects immediately in a map (O(1) lookup), then index them by property for efficient discovery.

**Benefit**:
- `stopEffect(id)` is O(1) - just delete from map and mark as pending removal
- `checkEffects()` is O(changed properties) - only check relevant effects
- Effects can be cancelled even before indexing completes

---

## Effect Lifecycle States

Effects exist in one of three states:

### 1. Pending Registration
- Effect is stored in `liveEffectsMap`
- Effect ID is in `pendingEffectIndexIds` Set
- Not yet indexed by properties
- Can still be cancelled via `stopEffect()`

**When**: Between `startEffect()` call and next frame's indexing

### 2. Indexed (Active)
- Effect is in `liveEffectsMap`
- Effect ID is NOT in `pendingEffectIndexIds`
- Indexed in `effectIdsByPhaseByStepByPropId`
- Will run when watched properties change

**When**: After indexing completes and effect is active

### 3. Pending Removal
- Effect is marked for removal
- Will be cleaned up in next frame
- No longer in `liveEffectsMap`

**When**: After `stopEffect()` is called

---

## Effect Replacement Logic

When an effect with duplicate ID is registered, Repond handles it intelligently:

### Pending Effect Replacement
```typescript
// Effect exists in liveEffectsMap but not yet indexed
// Solution: Update definition in place
liveEffectsMap.set(effectId, newEffectDef);
// Callback will use updated definition when indexing runs
```

**Why**: No need to restart - indexing hasn't happened yet, so just swap the definition.

### Indexed Effect Replacement
```typescript
// Effect exists and is already indexed
// Solution: Stop and restart
stopEffect(effectId);
startEffect(newEffectDef);
// Effect gets re-indexed with new properties
```

**Why**: Properties might have changed, so we need to re-index. Stopping and restarting ensures correct property tracking.

---

## Stateless Callbacks Pattern

**Problem**: If callbacks close over effect definitions, replacement won't work (callback would use old definition).

**Solution**: Callbacks look up the current effect from `liveEffectsMap`:

```typescript
// ❌ Stateful (closes over effectDef)
const callback = () => {
  runEffect(effectDef); // Uses captured version
};

// ✅ Stateless (looks up current version)
const callback = () => {
  const currentDef = meta.liveEffectsMap.get(effectId);
  if (currentDef) runEffect(currentDef); // Always uses latest
};
```

**Benefit**: Effect replacement works correctly - callbacks always execute the latest definition.

---

## Batching and Frame Timing

Effects follow Repond's frame-based update cycle:

### 1. State Changes (User Code)
```typescript
setState("player", { x: 10 });
setState("player", { y: 20 });
// Both batched, will process together
```

### 2. Next Frame: Calculate Diff
```typescript
// Compare nowState vs prevState
// Record what changed: ["player.x", "player.y"]
```

### 3. Check Which Effects Should Run
```typescript
// Look up effectIdsByPhaseByStepByPropId["player.x"]
// Look up effectIdsByPhaseByStepByPropId["player.y"]
// Deduplicate effect IDs (same effect may watch both)
```

### 4. Run Effects in Step Order
```typescript
// Run "physics" step effects
// Run "gameLogic" step effects
// Run "rendering" step effects
```

### 5. Index Any Pending Effects
```typescript
// Process pendingEffectIndexIds
// Add to effectIdsByPhaseByStepByPropId
// Clear from pendingEffectIndexIds Set
```

**Key Insight**: Pending effects get indexed AFTER effects run, so newly added effects don't run until next frame.

---

## Performance Characteristics

### Effect Registration
- **Add to storage**: O(1) - Set in Map
- **Add to pending**: O(1) - Set.add()
- **Total**: O(1)

### Effect Cancellation
- **Remove from storage**: O(1) - Map.delete()
- **Remove from pending**: O(1) - Set.delete()
- **Remove from index**: O(properties watched) - need to clean up property indexes
- **Total**: O(properties watched) - typically small

### Effect Discovery (Per Frame)
- **Calculate diff**: O(changed items × changed properties)
- **Find effects**: O(changed properties × effects per property)
- **Deduplicate**: O(effects found) - using object as Set
- **Total**: O(changed properties) - scales with what changed, not total effects

### Effect Execution
- **Run effects**: O(effects that should run × effect complexity)
- **Index pending**: O(pending effects × properties per effect)
- **Total**: O(effects to process)

**Key Insight**: Performance scales with what changed and how many effects watch those changes, not total item count or total effect count.

---

## Why This Design?

### ✅ Immediate Cancellation
Effects can be cancelled synchronously, even before indexing. Critical for React Strict Mode cleanup.

### ✅ Efficient Discovery
Only check effects that watch properties that actually changed. O(changed properties), not O(all effects).

### ✅ Effect Replacement
Stateless callbacks enable hot-swapping effect definitions without complex cleanup.

### ✅ Batched Indexing
Indexing is deferred to update cycle, reducing work if effects are added/removed rapidly.

### ✅ Type Safety
Map-based storage preserves full type information, no serialization needed.

---

## Common Patterns

### Pattern 1: Temporary Effects
```typescript
// Add effect
const effectId = startNewEffect({
  changes: ["enemy.health"],
  run: (enemyId) => { /* ... */ }
});

// Remove when done
stopEffect(effectId);
// Effect removed from storage immediately,
// cleanup from index happens next frame
```

### Pattern 2: Effect Groups
```typescript
// Define group
const effects = makeEffects((makeEffect) => ({
  effect1: makeEffect(/* ... */),
  effect2: makeEffect(/* ... */),
}));

// Start all at once
startEffectsGroup("myEffects");
// All effects indexed together in next frame

// Stop all at once
stopEffectsGroup("myEffects");
// All effects removed from storage immediately
```

### Pattern 3: React Hook Effects
```typescript
// Component mounts
useStoreEffect({ changes: ["player.health"], run: onHealthChange });
// Effect added with stable ID (via useRef)

// Strict mode: Component "unmounts" and "remounts"
// 1. Cleanup runs: stopEffect(id) - removes from storage
// 2. Setup runs: startEffect(id) - effect pending replacement is detected
// 3. Definition updated in place (still pending)
// 4. Next frame: Effect indexed once

// Real unmount
// Cleanup runs: stopEffect(id) - effect removed
```

---

## Debugging Tips

### Enable Warnings
```typescript
initRepond(stores, steps, { enableWarnings: true });
```

With warnings enabled, you'll see:
- Duplicate effect IDs (pending and indexed)
- Effects with no item types
- Effect not found errors

### Check Effect State
```typescript
// Is effect stored?
const stored = meta.liveEffectsMap.has(effectId);

// Is effect pending indexing?
const pending = meta.pendingEffectIndexIds.has(effectId);

// Is effect indexed?
// (Check effectIdsByPhaseByStepByPropId - more complex)

// Effect state combinations:
// stored=true, pending=true  -> Pending registration
// stored=true, pending=false -> Indexed (active)
// stored=false, pending=false -> Not registered or removed
```

---

## Related Documents

- [React Integration](./react-integration.md) - How hooks use the effect system
- [State Updates](./state-updates.md) - How the update cycle works
- [Immediate Storage Decision](../decisions/immediate-storage.md) - Why this design was chosen
