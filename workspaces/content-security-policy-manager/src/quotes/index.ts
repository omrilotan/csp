/**
 * Strips a string of single quotes.
 */
export const unquote = (value: string): string =>
	value.trim().replace(/^'|'$/g, "");
/**
 * Wraps a string in single quotes.
 */
export const quote = (value: string): string => `'${unquote(value)}'`;
