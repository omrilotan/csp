import { CSPSourceExpressions } from "../constants/index.ts";

/**
 * Strips a string of single quotes.
 */
export const unquote = (value: string): string =>
	value.trim().replace(/^'|'$/g, "");
/**
 * Wraps a string in single quotes.
 */
export const quote = (value: string): string => `'${unquote(value)}'`;

export const quoteSource = (
	source: ArrayElement<typeof CSPSourceExpressions>,
): string =>
	CSPSourceExpressions.includes(source) ||
	// Nonce: A server generated random value for every HTTP response
	/^nonce-/.test(source) ||
	// A Base64 encoding of the resource's content hash
	/^sha(256|384|512)+-/.test(source)
		? quote(source)
		: source;
