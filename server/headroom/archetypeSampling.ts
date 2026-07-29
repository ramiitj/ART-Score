// Task archetype sampling (docs/HEADROOM_MIGRATION_SPEC.md §6).
//
// Each generated item is a draw from the population of items admissible under
// the domain's ground rules and the difficulty definition -- the constrained-
// sampling design that replaces the originally specced hand-curated item bank.
// Within a single run, draws are WITHOUT replacement so a person's 3 items
// span genuinely different task archetypes: three near-duplicate items would
// inflate within-person consistency for reasons that have nothing to do with
// the person, corrupting the person x item variance decomposition (§11).
//
// The pool is small (4-6 archetypes per domain/difficulty), so exhausting it
// is possible in principle; when every archetype has been used the sampler
// falls back to the full pool rather than failing.

export function selectTaskArchetype(
  pool: string[],
  usedArchetypes: string[],
  // Injected for determinism in tests; defaults to Math.random in production.
  random: () => number = Math.random
): string | null {
  if (pool.length === 0) return null;

  const unused = pool.filter(a => !usedArchetypes.includes(a));
  const drawPool = unused.length > 0 ? unused : pool;

  const index = Math.min(Math.floor(random() * drawPool.length), drawPool.length - 1);
  return drawPool[index];
}
