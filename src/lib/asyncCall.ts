/**
 * Call item asynchronously if it is a function, otherwise return itself.
 * @param {any} item Potentially callable, possibly async function or promise.
 * @param  {...any} args Arguments to be applied to item if it is a function.
 * @returns {any} Result of promise, async/sync function, or the item if not a function.
 */
export default async function asyncCall(
  this: unknown,
  item: unknown,
  ...args: unknown[]
): Promise<unknown> {
  // eslint-disable-next-line no-return-await
  return await (typeof item === 'function' ? item.apply(this, args) : item)
}
