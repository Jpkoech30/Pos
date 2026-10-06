// Generates a unique key for one checkout attempt. Sent with every tap
// of Confirm on the same attempt — the backend dedupes on it, so a retry
// after a network timeout doesn't create a second order.
//
// Not cryptographically secure — uniqueness within a shop session is
// enough. Two random chunks make collision practically impossible.
export function newIdempotencyKey() {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10) +
    '-' +
    Math.random().toString(36).slice(2, 10)
  );
}