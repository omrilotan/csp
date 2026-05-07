import { CSPSourceKeywords } from "../constants/index.ts";
import type { CSPSource } from "../types/index.ts";

export function sortSources(
	[a]: [CSPSource, any[]],
	[b]: [CSPSource, any[]],
): number {
	const aIsKeyword = CSPSourceKeywords.includes(
		a as (typeof CSPSourceKeywords)[number],
	);
	const bIsKeyword = CSPSourceKeywords.includes(
		b as (typeof CSPSourceKeywords)[number],
	);
	if (aIsKeyword && !bIsKeyword) return -1;
	if (!aIsKeyword && bIsKeyword) return 1;
	return (a as string).localeCompare(b as string);
}
