# Documentation Clarification Process

This document tracks questions and clarifications to improve Repond's documentation.

**Date Started**: 2025-10-18

---

## Initial Understanding

Repond is a real-time state management library for React that manages collections of items (entities) with reactive effects. It provides declarative and imperative ways to respond to state changes.

---

## Resolved Clarifications

### 1. Target Use Cases ✓
**Question**: What are the primary use cases you designed Repond for?

**Answer**: All of the above! Originally made for drag-and-drop systems with many items requiring reactive animated positions. Redux was too slow, Zustand wasn't optimized for entities/items and couldn't leverage shortcuts enabled by entity-based architecture.

**Key Use Cases:**
- **Drag & Drop Systems**: Reactive animated positions for many items
- **3D Games**: Track characters, items, levels, etc.
- **Real-time Dashboards**: Entity-based state management
- **Event-Driven Systems**: Generic event systems can just set state, effects handle side effects automatically without needing app-specific knowledge

**Core Benefit**: Declarative effects mean you only change state, and the world updates based on rules. Any part of the app can update state, same effects run consistently.

---

### 2. Why "Repond" vs Existing Solutions? ✓
**Question**: How does Repond differentiate from Redux, Zustand, MobX, Recoil?

**Answer**:
- **vs Redux**: Real-time frame-by-frame updates WITHOUT performance cost. Redux spreads on every frame are not performant.
- **vs Zustand**: Created before Zustand, but Zustand lacks built-in entity handling. Requires custom entity logic that's difficult to maintain and update efficiently.
- **Key Differentiator**: Automatic typed strings for state access. No need to import specific stores or pass store objects around. Just use `getState()`, `setState()`, make effects, or use React hooks.

---

### 3. The Step System ✓
**Question**: What are "steps" conceptually?

**Answer**: Steps determine the ORDER effects (reactions) happen in. Ensures game logic happens before rendering, for example. Custom step names allow controlling effect execution order (e.g., "physics" → "gameLogic" → "rendering").

---

### 4. Effects vs React Effects ✓
**Question**: How should users think about Repond effects vs React's `useEffect`?

**Answer**: Repond effects are how to run side effects from state changes for items in a very efficient and simple way. They're complementary to React effects, not a replacement.

---

### 5. Refs System ✓
**Question**: What's the intended use case for refs?

**Answer**: Refs are for tying miscellaneous data to an item that is:
1. **Temporary** (never persisted across sessions), OR
2. **Not serializable** (e.g., DOM references, Three.js objects, callbacks)

**State is always serializable** - can be persisted as JSON across sessions.

---

### 6. Item Type Definition ✓
**Question**: How do users define their item types?

**Answer**: Define item types in the store definition object with `newState` and `newRefs` functions. These run when adding a new item. TypeScript infers property types from return values.

**Example:**
```typescript
export const wordsStore = {
  newState: () => ({
    position: { x: 0, y: 0 } as Position,
    wordId: "hello" as string,
    languageId: "ja" as LanguageId,
    passProgress: 0,        // Progress in current pass (0-3)
    passedThisAge: false,   // Has passed at least once this age
    masteryPoints: 0,       // Long-term mastery (persists across ages)
  }),
  newRefs: () => ({}),
};
```

---

### 7. Performance Characteristics ✓
**Question**: What's the performance profile and scale limits?

**Answer**:
- **Item count has essentially NO EFFECT on performance** - only reacts to items updated with setState!
- Suitable for 1000s, 10,000s+ items
- Only does bare minimum work for updated items
- **Primary limit**: RAM to store large JavaScript objects
- **Bottleneck**: Not the number of items, but how much state changes per frame

**Key Performance Feature**: O(1) complexity for updates regardless of total item count.

---

### 8. The Name "Repond" ✓
**Question**: Etymology of "Repond"?

**Answer**: Unique re-spelling of "respond" (React was taken!). Considered "enty" (entity) but also taken. Focus is on responding to state changes very efficiently. Supports both entity collections AND single-item stores.

---

### 9. React vs Framework Agnostic ✓
**Question**: Is Repond framework-specific?

**Answer**: **Essentially framework agnostic!** React hooks included for convenience since most projects use React and it's common. Core system works standalone.

---

### 10. Effect Dependencies ✓
**Question**: How granular can effect change tracking be?

**Answer**:
- Can check specific itemIds in effects
- Uses **typed string-based patterns** with autocomplete
- **Different from React dependency arrays**: Supply state-related strings, not values
- Integrated into Repond's type system for full type safety

---

### 11. State Updates and Batching ✓
**Question**: Are setState calls batched?

**Answer**:
- **Yes, all setStates are automatically batched!**
- Framework-agnostic, doesn't rely on React's batching
- **No synchronous updates** currently (required for diffing and getPrevState)
- **Alternative**: Wait for next Repond frame/tick (state guaranteed updated) OR use local variables within same function instead of getState

**Example:**
```typescript
const newCountValue = 3 + 5;
// Use newCountValue instead of getState("shared").countValue
```

**Note**: `getState()` without second parameter gets the first item found. Second parameter is itemId.

---

### 12. Documentation Priorities ✓
**Question**: What documentation order is most helpful?

**Answer**: The suggested order is good:
1. Getting Started / Quick Start
2. Core Concepts Guide
3. API Reference
4. Migration guides (from Redux, etc.)
5. Advanced patterns / Best practices
6. Example projects

---

## Key Insights Summary

### Core Value Proposition
Repond provides **entity-optimized state management** with:
1. **O(1) performance** regardless of item count (only processes what changed)
2. **Declarative effects** that automatically run when state changes
3. **Type-safe string-based** state access (no store imports needed)
4. **Framework agnostic** with React hooks for convenience
5. **Serializable state** with non-serializable refs support
6. **Automatic batching** of all state updates

### Primary Differentiators
- Redux: Performance without spread overhead
- Zustand: Built-in entity optimization
- All: Typed string access, no store imports, declarative effects system

### Target Scenarios
- Entity-heavy applications (drag-drop, games, real-time dashboards)
- Event-driven architectures (generic event systems + declarative effects)
- Applications requiring serializable state persistence
- Real-time frame-by-frame updates

---

## Action Items

Based on answers, we've created:
- [x] CLAUDE.md (AI agent context file)
- [x] README.md improvements (comprehensive user-facing docs)
- [x] Getting started guide ([docs/GETTING_STARTED.md](docs/GETTING_STARTED.md))
- [x] Inline code comments for complex functions:
  - [x] src/updating.ts (main update orchestration logic)
  - [x] src/checkEffects.ts (effect matching and filtering)
  - [x] src/getStatesDiff.ts (diff calculation algorithm)
  - [x] src/helpers/effects.ts (effect registration and caching)
  - [x] src/helpers/frames.ts (frame timing and scheduling)

Remaining documentation (recommended for future):
- [ ] Core concepts guide (deep dive into architecture)
- [ ] API documentation (comprehensive reference with all functions)
- [ ] Migration guides (from Redux, Zustand)
- [ ] Advanced patterns documentation
- [ ] Example projects (drag-drop, 3D game, dashboard)
- [ ] Video tutorials or interactive demos
