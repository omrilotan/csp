import { CSPSourceKeywords } from "../constants/index.ts";
import { CSPSource } from "../types/index.ts";

export function sortSources(
	[a]: [CSPSource, any[]],
	[b]: [CSPSource, any[]],
): number {
	const aIsKeyword = CSPSourceKeywords.includes(
		a as ArrayElement<typeof CSPSourceKeywords>,
	);
	const bIsKeyword = CSPSourceKeywords.includes(
		b as ArrayElement<typeof CSPSourceKeywords>,
	);
	if (aIsKeyword && !bIsKeyword) return -1;
	if (!aIsKeyword && bIsKeyword) return 1;
	return (a as string).localeCompare(b as string);
}
