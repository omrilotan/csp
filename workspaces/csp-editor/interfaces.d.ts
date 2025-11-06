/**
 * Type of the elements in an array
 */
declare type ArrayElement<ArrayType extends unknown[]> = ArrayType[number];

/**
 * An array that can not be empty
 */
declare type NonEmptyArray<T> = [T, ...T[]];
