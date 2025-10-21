# Decision: Warnings Disabled by Default

**Date**: October 2025
**Status**: Implemented

---

## Context

After implementing the React Strict Mode fix, we added several development warnings:

1. **Effect Replacement**: Warning when duplicate effect IDs are registered
2. **Effect Not Found**: Warnings when trying to start/stop non-existent effects
3. **Missing Item Types**: Warnings when effects watch properties that don't exist
4. **Infinite Loops**: Warning when step iterations exceed threshold

**Problem**: These warnings, while useful for debugging, created console clutter during normal development.

**User feedback**: "The warnings can be a bit intrusive to console logs while in dev mode"

---

## Decision

All internal Repond warnings are **disabled by default** and can be enabled via configuration:

```typescript
// Default: Warnings off (clean console)
initRepond(stores, steps);

// Opt-in: Warnings on (debugging)
initRepond(stores, steps, { enableWarnings: true });
```

**Implementation**:
- Created `warn()` helper that checks `meta.config.enableWarnings`
- Replaced all `console.warn()` calls with `warn()`
- Default config: `{ enableWarnings: false }`

---

## Alternatives Considered

### Alternative 1: Warnings On by Default
Keep warnings enabled unless explicitly disabled.

**Rejected because:**
- Clutters console during normal development
- Many warnings are expected (e.g., Strict Mode replacement)
- Library should be "quiet by default"
- Most users don't need internal debugging info

---

### Alternative 2: Different Warning Levels
Implement log levels like "error", "warn", "info", "debug".

**Rejected because:**
- Over-engineered for current needs
- More complex API
- Users can't easily filter specific warnings
- Can add later if needed (start simple)

---

### Alternative 3: Environment-Based (NODE_ENV)
Enable warnings in development, disable in production.

**Rejected because:**
- Repond is client-side, NODE_ENV not always available
- Users may want warnings off even in dev
- Less explicit control
- Adds environment dependency

---

### Alternative 4: Per-Warning Configuration
Allow configuring each warning type individually.

**Rejected because:**
- Too granular for v1
- More complex API
- Can add later if users request it
- Start with simple boolean flag

---

## Consequences

### Positive ✅

1. **Clean Console by Default**
   - No intrusive warnings during normal development
   - Better developer experience
   - Console shows only app-specific logs

2. **Opt-In Debugging**
   - Easy to enable when needed: `{ enableWarnings: true }`
   - Warnings available for troubleshooting
   - Clear signal: "I want verbose output"

3. **Expected Warnings Don't Spam**
   - React Strict Mode replacement warnings are silent by default
   - Intentional patterns don't clutter console
   - Only see warnings when explicitly debugging

4. **Simple API**
   - Single boolean flag
   - Easy to understand and document
   - Room to expand later if needed

### Negative ⚠️

1. **Hidden Issues**
   - Users might not notice effect registration problems
   - Silent failures could confuse newcomers
   - Need good documentation to explain when to enable

2. **Extra Configuration**
   - Users must know about `enableWarnings` to debug
   - One more thing to remember during troubleshooting
   - Documentation must emphasize when to use

3. **All or Nothing**
   - Can't selectively enable specific warnings
   - Debugging one issue shows all warnings
   - Might be noisy when hunting specific problem

---

## Implementation Notes

### Centralized Warning Helper

Created `src/helpers/logging.ts`:

```typescript
import { repondMeta as meta } from "../meta";

export function warn(...args: any[]) {
  if (meta.config.enableWarnings) {
    console.warn(...args);
  }
}
```

**Benefits**:
- Single source of truth
- Easy to extend (add log levels later)
- Type-safe
- No runtime overhead when disabled

---

### Configuration Type

```typescript
export type RepondConfig = {
  enableWarnings?: boolean;
};

// In repondMeta
config: {
  enableWarnings: false,  // Default
} as RepondConfig
```

**Optional parameter** makes it backward compatible:

```typescript
// Still works (warnings disabled)
initRepond(stores, steps);

// Explicit config
initRepond(stores, steps, { enableWarnings: true });
```

---

### Warnings Covered

**26 warnings** replaced across codebase:

| File | Count | Types |
|------|-------|-------|
| `helpers/effects.ts` | 5 | Effect replacement, missing item types |
| `usable/effects.ts` | 2 | Effect not found |
| `usable/paramEffects.ts` | 8 | Param effect operations |
| `usable/getSet.ts` | 6 | State access errors |
| `checkEffects.ts` | 2 | Effect validation |
| `updating.ts` | 3 | Infinite loop detection |

All now respect `enableWarnings` config.

---

## Usage Guidelines

### When to Enable Warnings

✅ **Enable when:**
- Debugging effect registration issues
- Effects not running as expected
- Investigating React Strict Mode behavior
- Contributing to Repond development
- Reporting bugs

❌ **Keep disabled when:**
- Normal application development
- Production builds
- Warnings are understood and intentional
- Console needs to be clean

---

### Documentation Strategy

**In docs**, emphasize:
1. Warnings are **opt-in** for debugging
2. How to enable: `{ enableWarnings: true }`
3. What warnings indicate
4. When warnings are expected (e.g., Strict Mode)

**Example from README**:
```typescript
// Debugging: enable warnings to diagnose issues
initRepond(stores, steps, { enableWarnings: true });
```

---

## Future Considerations

### Potential Enhancements

If users request more control, we could add:

```typescript
type RepondConfig = {
  warnings?: boolean | {
    effectReplacement?: boolean;
    effectNotFound?: boolean;
    missingItemTypes?: boolean;
    infiniteLoops?: boolean;
  };
};
```

**But**: Wait for user feedback before adding complexity.

---

### Alternative: Custom Logger

Could allow custom warning handler:

```typescript
type RepondConfig = {
  onWarn?: (message: string, ...args: any[]) => void;
};

// User-defined handler
initRepond(stores, steps, {
  onWarn: (msg, ...args) => {
    if (msg.includes("infinite loop")) {
      myErrorTracker.log(msg, ...args);
    }
  }
});
```

**But**: Over-engineered for current needs. Add if requested.

---

## Trade-offs Analysis

### User Experience vs Debuggability

| Aspect | Warnings On | Warnings Off |
|--------|-------------|--------------|
| **Console** | Cluttered | Clean ✅ |
| **Debugging** | Easy ✅ | Requires opt-in |
| **Newcomers** | Might confuse | Might miss issues |
| **Experienced** | Annoying | Can enable when needed ✅ |

**Verdict**: Warnings off by default serves experienced developers better, with clear path to enable for debugging.

---

### Performance Impact

**Disabled** (default):
```typescript
warn("message");
// One if-check, return immediately
// Cost: ~1ns
```

**Enabled**:
```typescript
warn("message");
// If-check passes, calls console.warn()
// Cost: ~1μs (console.warn overhead)
```

**Impact**: Negligible in both cases. No performance concern.

---

## Related Decisions

- [Immediate Storage](./immediate-storage.md) - Why effect replacement warnings exist
- [Stateless Callbacks](./stateless-callbacks.md) - Why replacement is safe and might warn

---

## References

- [Configuration Documentation](../../README.md#configuration)
- Implementation: [src/helpers/logging.ts](../../src/helpers/logging.ts)
- Config type: [src/meta.ts](../../src/meta.ts)
