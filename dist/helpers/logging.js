import { repondMeta as meta } from "../meta";
/**
 * Conditional console.warn that respects the enableWarnings config.
 * Only logs if enableWarnings is true.
 *
 * @param args - Arguments to pass to console.warn
 */
export function warn(...args) {
    if (meta.config.enableWarnings) {
        console.warn(...args);
    }
}
