/**
 * Strip URL protocol from a source token
 */
function stripProtocol(source: string): string {
	return source.replace(/^https?:\/{2}/, "");
}

/** Keyword sources like 'self', 'unsafe-eval' */
function isKeyword(token: string): boolean {
	return token.startsWith("'");
}

/** Wildcard sources like *.example.com */
function isWildcard(token: string): boolean {
	return token.startsWith("*.");
}

/** Lowercased, protocol-stripped domain for comparisons */
function normalizeDomain(source: string): string {
	return stripProtocol(source).toLowerCase();
}

const HTTP_RE = /^http:\/{2}/i;
const HTTPS_RE = /^https:\/{2}/i;

/**
 * Remove redundant CSP sources from a sources string
 *
 * Algorithm (order-preserving):
 * 1) Tokenize the input into keywords, wildcards and domains.
 * 2) Group domains by their bare form (protocol removed, lowercased) to detect protocol redundancy.
 * 3) Precompute which wildcard bases (*.example.com) have explicit subdomains listed.
 * 4) Iterate original tokens in order and build the output while skipping anything covered by a wildcard
 *    and consolidating http/https to the bare domain when both exist.
 */
export function removeRedundantSources(
	/**
	 * Space-separated CSP sources
	 */
	sources: string,
): string {
	const tokens = sources.trim().match(/\S+/g) ?? [];

	// Collect wildcards and group domains
	const wildcards: string[] = [];
	type DomainGroup = {
		hasBare: boolean;
		hasHttp: boolean;
		hasHttps: boolean;
		firstSeenToken: string; // original token as first seen
		firstSeenBare: string; // bare domain as first seen
	};
	const domains = new Map<string, DomainGroup>(); // key = normalized bare domain

	for (const token of tokens) {
		if (isKeyword(token)) continue; // handled directly while emitting
		if (isWildcard(token)) {
			wildcards.push(token);
			continue;
		}

		const bare = stripProtocol(token);
		const key = normalizeDomain(token);
		const prev = domains.get(key);
		const isHttp = HTTP_RE.test(token);
		const isHttps = HTTPS_RE.test(token);
		domains.set(key, {
			hasBare: (prev?.hasBare ?? false) || (!isHttp && !isHttps),
			hasHttp: (prev?.hasHttp ?? false) || isHttp,
			hasHttps: (prev?.hasHttps ?? false) || isHttps,
			firstSeenToken: prev?.firstSeenToken ?? token,
			firstSeenBare: prev?.firstSeenBare ?? bare,
		});
	}

	// For each wildcard base, check if there are explicit subdomains
	const wildcardBases = wildcards.map((wildcard) =>
		wildcard.slice(2).toLowerCase(),
	);
	const wildcardBaseHasSubdomains = new Map<string, boolean>();
	for (const baseDomain of wildcardBases)
		wildcardBaseHasSubdomains.set(baseDomain, false);
	if (wildcardBases.length) {
		for (const domainKey of domains.keys()) {
			for (const baseDomain of wildcardBases) {
				if (domainKey !== baseDomain && domainKey.endsWith("." + baseDomain)) {
					wildcardBaseHasSubdomains.set(baseDomain, true);
				}
			}
		}
	}

	// Choose canonical token for a group
	const chooseCanonical = (group: DomainGroup): string => {
		if (group.hasBare) return group.firstSeenBare; // prefer bare when present
		if (group.hasHttp && group.hasHttps) return group.firstSeenBare; // consolidate to bare
		return group.firstSeenToken; // keep original form
	};

	const output: string[] = [];
	const seen = new Set<string>();

	const removeCoveredByWildcard = (wildcard: string) => {
		const baseDomain = wildcard.slice(2).toLowerCase();
		for (let i = output.length - 1; i >= 0; i--) {
			const resultToken = output[i];
			if (isWildcard(resultToken)) continue; // don't remove other wildcards here
			const resultKey = normalizeDomain(resultToken);
			const isBase = resultKey === baseDomain;
			const isSubdomain = !isBase && resultKey.endsWith("." + baseDomain);
			// Wildcards only cover subdomains, never the base domain
			if (isSubdomain) {
				seen.delete(resultToken);
				output.splice(i, 1);
			}
		}
	};

	for (const token of tokens) {
		if (isKeyword(token)) {
			if (!seen.has(token)) {
				output.push(token);
				seen.add(token);
			}
			continue;
		}
		if (isWildcard(token)) {
			if (!seen.has(token)) {
				// remove any already-added covered tokens
				removeCoveredByWildcard(token);
				output.push(token);
				seen.add(token);
			}
			continue;
		}

		const domainKey = normalizeDomain(token);
		const group = domains.get(domainKey)!;
		const canonical = chooseCanonical(group);

		// Skip if covered by any wildcard
		let covered = false;
		for (const baseDomain of wildcardBases) {
			const isBase = domainKey === baseDomain;
			const isSubdomain = !isBase && domainKey.endsWith("." + baseDomain);
			// Wildcards only cover subdomains, never the base domain
			if (isSubdomain) {
				covered = true;
				break;
			}
		}
		if (covered) continue;

		if (!seen.has(canonical)) {
			output.push(canonical);
			seen.add(canonical);
		}
	}

	return output.sort().join(" ");
}
