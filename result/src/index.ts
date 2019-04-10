/**
 * A successful value
 */
export interface Ok<R> {
    ok: R;
}

/**
 * A failed value
 */
export interface Err<E> {
    err: E;
}

/**
 * A success or failure
 */
export type Result<R, E> = Ok<R> | Err<E>;

/**
 * Test if a given `Result` is an `Ok`
 */
export function isOk<R>(result: Result<R, any>): result is Ok<R> {
    return result.hasOwnProperty("ok");
}

/**
 * Test if a given `Result` is an `Err`
 */
export function isErr<E>(result: Result<any, E>): result is Err<E> {
    return !isOk(result);
}

/**
 * Create an `Ok`
 */
export function Ok<R>(ok: R): Ok<R> {
    return { ok };
}

/**
 * Create an `Err`
 */
export function Err<E>(err: E): Err<E> {
    return { err };
}
