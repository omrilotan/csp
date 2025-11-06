/**
 * Remove redundant CSP policies from a policy string
 * @param policies - Space-separated CSP policies
 * @returns Cleaned up policy string with redundancies removed
 */
export function removeRedundantPolicies(policies: string): string {
	const policyArray = policies.split(' ');
	const result: string[] = [];

	// Helper to strip protocol from a policy
	const stripProtocol = (policy: string): string => {
		if (policy.startsWith('https://')) return policy.slice(8);
		if (policy.startsWith('http://')) return policy.slice(7);
		return policy;
	};

	// Check if there are multiple protocols for same domain - prefer no protocol
	const domainCounts = new Map<string, { hasProtocol: boolean; noProtocol: boolean }>();
	for (const policy of policyArray) {
		const bare = stripProtocol(policy);
		if (!domainCounts.has(bare)) {
			domainCounts.set(bare, { hasProtocol: false, noProtocol: false });
		}
		const info = domainCounts.get(bare)!;
		if (policy.startsWith('https://') || policy.startsWith('http://')) {
			info.hasProtocol = true;
		} else {
			info.noProtocol = true;
		}
	}

	// Detect if multiple subdomains exist for the same base domain
	// First, collect all existing wildcards from input
	const existingWildcards = new Set<string>();
	for (const policy of policyArray) {
		const bare = stripProtocol(policy);
		if (bare.startsWith('*.')) {
			existingWildcards.add(bare);
		}
	}

	// Group subdomains by their potential base domain
	const baseDomainMap = new Map<string, Set<string>>();

	for (const policy of policyArray) {
		const bare = stripProtocol(policy);
		if (bare.startsWith('*.') || bare.startsWith("'")) continue; // Skip wildcards and keywords

		// Check if it's covered by an existing wildcard
		let coveredByWildcard = false;
		for (const wildcard of existingWildcards) {
			const baseDomain = wildcard.slice(2);
			if (bare.endsWith('.' + baseDomain) || bare === baseDomain) {
				coveredByWildcard = true;
				break;
			}
		}

		// Don't try to generate wildcards for domains already covered
		if (coveredByWildcard) continue;

		// Check if it's a subdomain (has at least 3 parts, e.g., www.example.com)
		const parts = bare.split('.');
		if (parts.length >= 3) {
			// Only use the last 2 parts as base domain to avoid confusion
			const baseDomain = parts.slice(-2).join('.');
			if (!baseDomainMap.has(baseDomain)) {
				baseDomainMap.set(baseDomain, new Set());
			}
			baseDomainMap.get(baseDomain)!.add(bare);
		}
	}

	// Find base domains with multiple DIFFERENT subdomains - replace with wildcard
	const wildcardReplacements = new Map<string, string>();

	for (const [baseDomain, subdomains] of baseDomainMap) {
		// Need at least 2 different subdomains to warrant a wildcard
		if (subdomains.size >= 2) {
			const wildcard = `*.${baseDomain}`;
			// Mark all subdomains as needing replacement with wildcard
			for (const subdomain of subdomains) {
				wildcardReplacements.set(subdomain, wildcard);
			}
		}
	}

	for (const policy of policyArray) {
		let isRedundant = false;
		const policyWithoutProtocol = stripProtocol(policy);

		// Check if this policy should be replaced with a wildcard
		const wildcardReplacement = wildcardReplacements.get(policyWithoutProtocol);
		if (wildcardReplacement) {
			// Check if we already added this wildcard
			if (!result.includes(wildcardReplacement)) {
				result.push(wildcardReplacement);
			}
			continue; // Skip adding the individual subdomain
		}

		// Check if this policy is redundant with any existing policy in result
		for (const existing of result) {
			const existingWithoutProtocol = stripProtocol(existing);

			// If existing is a wildcard pattern and current matches it
			if (existing.startsWith('*.')) {
				const domain = existing.slice(2); // Remove *. prefix
				// Check if policy is a subdomain of the wildcard
				if (policyWithoutProtocol.endsWith('.' + domain)) {
					isRedundant = true;
					break;
				}
				// Also remove the base domain if a subdomain was explicitly listed
				// This means *.domain.com should cover domain.com when subdomains are present
				const hasSubdomainInInput = policyArray.some(p => {
					const bare = stripProtocol(p);
					return bare.endsWith('.' + domain) && !bare.startsWith('*.');
				});
				if (policyWithoutProtocol === domain && hasSubdomainInInput) {
					isRedundant = true;
					break;
				}
			}

			// If the policy (without protocol) matches an existing one
			if (policyWithoutProtocol === existingWithoutProtocol) {
				// Prefer version without protocol
				const domainInfo = domainCounts.get(policyWithoutProtocol);
				if (domainInfo && domainInfo.hasProtocol && !domainInfo.noProtocol) {
					// Only protocol versions exist - replace with bare domain
					if (existing.startsWith('https://') || existing.startsWith('http://')) {
						// Replace first protocol version with bare domain
						result[result.indexOf(existing)] = policyWithoutProtocol;
					}
					isRedundant = true;
				} else if ((existing.startsWith('https://') || existing.startsWith('http://')) &&
				           !(policy.startsWith('https://') || policy.startsWith('http://'))) {
					// Replace protocol version with non-protocol
					result[result.indexOf(existing)] = policy;
					isRedundant = true;
				} else {
					isRedundant = true;
				}
				break;
			}
		}		// Check if adding this policy makes any existing policy redundant
		if (!isRedundant) {
			// If current policy is a wildcard, remove any subdomains
			if (policy.startsWith('*.')) {
				const domain = policy.slice(2);
				const hasSubdomainInInput = policyArray.some(p => {
					const bare = stripProtocol(p);
					return bare.endsWith('.' + domain) && !bare.startsWith('*.');
				});

				for (let i = result.length - 1; i >= 0; i--) {
					const existing = result[i];
					const existingWithoutProtocol = stripProtocol(existing);

					// Remove subdomains
					if (existingWithoutProtocol.endsWith('.' + domain)) {
						result.splice(i, 1);
					}
					// Remove base domain only if subdomains were explicitly listed
					else if (existingWithoutProtocol === domain && hasSubdomainInInput) {
						result.splice(i, 1);
					}
				}
			}

			result.push(policy);
		}
	}

	return result.join(' ');
}
