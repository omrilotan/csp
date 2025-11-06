import { describe, test } from "node:test";
import { equal } from "node:assert/strict";
import { removeRedundantPolicies } from './index.ts';

describe('removeRedundantPolicies', () => {
	[
			[ "'self' example.com *.example.com", "'self' example.com *.example.com" ],
			[ "'self' www.example.com *.example.com", "'self' *.example.com" ],
			[ "'self' *.example.com sub.example.com", "'self' *.example.com" ],
			[ "api.example.com https://api.example.com", "api.example.com" ],
			[ "https://api.example.com", "https://api.example.com" ],
			[ "https://api.example.com api.example.com www.api.example.com *.api.example.com", "*.api.example.com" ],
			[ "https://api.example.com http://api.example.com", "api.example.com" ],
			[ "www.example.com subdomain.example.com", "*.example.com" ],
		].forEach(([input, expected]) => {
		test(`removes redundancies from: ${input}`, () => {
			const result = removeRedundantPolicies(input);
			equal(result, expected);
		});
	});
});
