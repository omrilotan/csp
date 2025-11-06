import { describe, test } from "node:test";
import { equal } from "node:assert/strict";
import { removeRedundantSources } from "./index.ts";

describe("removeRedundantSources", () => {
	[
		[
			"nothing",
			"'self' example.com *.example.com",
			"'self' *.example.com example.com",
		],
		[
			"hostname covered by domain",
			"'self' www.example.com *.example.com",
			"'self' *.example.com",
		],
		[
			"hostnames covered by wildcard",
			"'self' *.example.com  www.example.com sub.example.com",
			"'self' *.example.com",
		],
		[
			"protocol is redundant",
			"api.example.com https://api.example.com",
			"api.example.com",
		],
		["nothing", "https://api.example.com", "https://api.example.com"],
		[
			"siblings",
			"api.example.com cdn.example.com",
			"api.example.com cdn.example.com",
		],
		[
			"protocol and hostnames",
			"https://api.example.com *.api.example.com api.example.com www.api.example.com",
			"*.api.example.com api.example.com",
		],
		[
			"two protocols",
			"https://api.example.com http://api.example.com",
			"api.example.com",
		],
		[
			"protocol and TLD",
			"'self' *.example.com subdomain.example.com https://example.com",
			"'self' *.example.com https://example.com",
		],
		["TLDs", "example.co.uk other.co.uk", "example.co.uk other.co.uk"],
	].forEach(([description, input, expected]) => {
		test(description, () => {
			const result = removeRedundantSources(input);
			equal(result, expected);
		});
	});
});
