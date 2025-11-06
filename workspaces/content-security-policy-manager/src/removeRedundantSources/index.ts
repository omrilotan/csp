/**
 * Remove redundant CSP sources from a sources string
 * @param sources - Space-separated CSP sources
 * @returns Cleaned up sources string with redundancies removed
 */
// Helper: strip URL protocol from a policy token
function stripProtocol(source: string): string {
	return source.replace(/^https?:\/\//, '');
}

// Helper: does token include protocol
function hasProtocol(source: string): boolean {
	return /^https?:\/\//.test(source);
}

// Helper: is token a wildcard expression
function isWildcard(policy: string): boolean {
	return policy.startsWith('*.');
}

// Helper: does domain match wildcard
function matchesWildcard(domain: string, wildcard: string): boolean {
	const base = wildcard.slice(2);
	return domain.endsWith('.' + base) || domain === base;
}

export function removeRedundantSources(sources: string): string {
	const policyArray = sources.trim().split(/\s+/);

	// Analyze input: track protocol usage per bare domain
	const bareVersions = new Map<string, { hasProtocol: boolean; noProtocol: boolean }>();
	for (const policy of policyArray) {
		const bare = stripProtocol(policy);
		if (!bareVersions.has(bare)) {
			bareVersions.set(bare, { hasProtocol: false, noProtocol: false });
		}
		bareVersions.get(bare)![hasProtocol(policy) ? 'hasProtocol' : 'noProtocol'] = true;
	}

	// Build result
	const result: string[] = [];

	for (const policy of policyArray) {
		const bare = stripProtocol(policy);



		// Check if redundant with existing results
		let redundant = false;
		for (const existing of result) {
			const existingBare = stripProtocol(existing);

			// Covered by wildcard
			if (isWildcard(existing) && matchesWildcard(bare, existing)) {
				// Also remove base domain if subdomains exist
				const hasSubdomains = policyArray.some(p => {
					const b = stripProtocol(p);
					return b.endsWith('.' + existing.slice(2)) && !isWildcard(b);
				});
				if (bare === existing.slice(2) && !hasSubdomains) {
					continue; // Keep base domain
				}
				redundant = true;
				break;
			}

			// Duplicate (same bare domain)
			if (bare === existingBare) {
				const info = bareVersions.get(bare)!;
				// Replace protocol version with bare if both protocols exist and no bare version
				if (info.hasProtocol && !info.noProtocol && hasProtocol(existing)) {
					result[result.indexOf(existing)] = bare;
				}
				// Replace protocol with non-protocol
				else if (hasProtocol(existing) && !hasProtocol(policy)) {
					result[result.indexOf(existing)] = policy;
				}
				redundant = true;
				break;
			}
		}

		if (redundant) continue;

		// If adding a wildcard, remove covered domains
		if (isWildcard(policy)) {
			const hasSubdomains = policyArray.some(p => {
				const b = stripProtocol(p);
				return b.endsWith('.' + policy.slice(2)) && !isWildcard(b);
			});

			for (let i = result.length - 1; i >= 0; i--) {
				const existingBare = stripProtocol(result[i]);
				if (matchesWildcard(existingBare, policy)) {
					// Only remove base if subdomains were present
					if (existingBare === policy.slice(2) && !hasSubdomains) {
						continue;
					}
					result.splice(i, 1);
				}
			}
		}

		result.push(policy);
	}

	return result.join(' ');
}
