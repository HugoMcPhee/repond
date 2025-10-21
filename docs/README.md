# Repond Documentation

This directory contains architecture documentation and decision records for Repond.

---

## For Users

**Getting Started**: See [GETTING_STARTED.md](./GETTING_STARTED.md) for a tutorial on building your first Repond app.

**API Reference**: See the main [README.md](../README.md) for complete API documentation.

**Best Practices**: See [CLAUDE.md](../CLAUDE.md) for comprehensive patterns and guidelines.

---

## For Contributors & AI Agents

This documentation helps understand Repond's internal architecture without reading all source code.

### Architecture Documentation

Located in `architecture/` - explains how Repond works internally:

- **[effect-system.md](./architecture/effect-system.md)** - Two-tier storage, pending vs indexed effects, batching
- **[react-integration.md](./architecture/react-integration.md)** - How hooks work, Strict Mode compatibility, stable IDs
- **[state-updates.md](./architecture/state-updates.md)** - Frame-based batching, step system, O(changed items) performance

**When to read**:
- Understanding how effects are stored and discovered
- Debugging effect registration issues
- Contributing to the effect system
- Optimizing performance-critical code

---

### Architectural Decision Records (ADRs)

Located in `decisions/` - documents key design choices and their rationale:

- **[immediate-storage.md](./decisions/immediate-storage.md)** - Why effects are stored immediately with pending tracking
- **[stateless-callbacks.md](./decisions/stateless-callbacks.md)** - Why callbacks look up from map instead of closing over definitions
- **[warnings-default-off.md](./decisions/warnings-default-off.md)** - Why warnings are disabled by default

**When to read**:
- Understanding why Repond works a certain way
- Before proposing architectural changes
- Learning from past design trade-offs
- Avoiding re-litigating solved problems

---

## Documentation Structure

```
docs/
├── README.md                    (this file - navigation guide)
├── GETTING_STARTED.md          (user tutorial)
│
├── architecture/               (internal design docs)
│   ├── effect-system.md       (how effects work)
│   ├── react-integration.md   (hooks & strict mode)
│   └── state-updates.md       (batching & performance)
│
└── decisions/                  (architectural decision records)
    ├── immediate-storage.md    (pending effect tracking)
    ├── stateless-callbacks.md  (why callbacks look up from map)
    └── warnings-default-off.md (configuration rationale)
```

---

## What These Docs Explain

### Effect System Architecture
- **Two-tier storage**: `liveEffectsMap` (storage) + `effectIdsByPhaseByStepByPropId` (discovery)
- **Pending states**: Effects stored immediately, indexed in next frame
- **Effect replacement**: How duplicate IDs are handled
- **Performance**: O(changed items) not O(total items)

### React Integration
- **Strict Mode compatibility**: Stable IDs via `useRef`
- **Immediate cancellation**: Why synchronous cleanup works
- **Hook patterns**: `useStore`, `useStoreItem`, `useStoreEffect`

### State Updates
- **Frame-based batching**: All setState calls processed together
- **Step system**: `physics → gameLogic → rendering` execution order
- **During vs end**: Looping effects vs one-shot effects
- **Diff calculation**: Only processes changed items

### Design Decisions
- **Why immediate storage**: Enables React Strict Mode compatibility
- **Why stateless callbacks**: Enables effect replacement
- **Why warnings off**: Better developer experience by default

---

## Contributing to Docs

### When Adding Features

If you add a significant feature, consider:

1. **Update Architecture Docs**: Explain how it works internally
2. **Add Decision Record**: Document why you chose this approach
3. **Update User Docs**: Add to GETTING_STARTED.md or README.md
4. **Update CLAUDE.md**: Add patterns and best practices

### Documentation Principles

✅ **Do**:
- Explain **why** not just **what**
- Include code examples
- Document trade-offs and alternatives
- Write for future maintainers (including AI agents)
- Keep user-facing docs separate from architecture docs

❌ **Don't**:
- Document implementation details that change frequently
- Create docs that duplicate source code comments
- Write step-by-step implementation logs
- Keep outdated investigation documents

---

## Questions?

- **Using Repond**: See [GETTING_STARTED.md](./GETTING_STARTED.md) or [README.md](../README.md)
- **Understanding internals**: Read architecture docs first
- **Contributing**: Read decision records to understand design rationale
- **Found a bug**: Check if warnings enabled (`enableWarnings: true`) helps debug
