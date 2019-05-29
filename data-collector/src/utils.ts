export const keys = Object.keys as <T>(o: T) => Array<Extract<keyof T, string>>;

/**
 * A type safe merge of the objects
 */
export function merge<A extends any[]>(
    ...rest: A
): UnionToIntersection<A[number]> {
    return Object.assign({}, ...rest);
}

/**
 * @author https://stackoverflow.com/users/2887218/jcalz
 * @see https://stackoverflow.com/a/50375286/10325032
 */
export type UnionToIntersection<Union> = (Union extends any
    ? (argument: Union) => void
    : never) extends (argument: infer Intersection) => void
    ? Intersection
    : never;
