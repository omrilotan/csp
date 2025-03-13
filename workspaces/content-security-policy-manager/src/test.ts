import { describe, test } from "node:test";
import { deepEqual, equal, notEqual } from "node:assert/strict";
import { ContentSecurityPolicyManager } from "./index.ts";
import { validateTrustedTypes } from "./validateTrustedTypes/index.ts";
import reports from "../fixtures/reports.json" with { type: "json" };
import type { CSPViolationReport } from "./types/index.ts";

describe("content-security-policy-manager", (): void => {
	const csp = new ContentSecurityPolicyManager();
	test("Create a new ContentSecurityPolicyManager and add a few directives", (context): void => {
		csp.add("self", "script-src", "style-src");
		csp.add("unsafe-inline", "script-src");
		csp.add("unsafe-eval", "script-src");
		csp
			.add("*.example.com", "script-src")
			.add("*.example.com", "style-src")
			.add("*.example.com", "style-src");
		csp.add("https://example.com", "script-src", "style-src");
		csp.set("upgrade-insecure-requests");
		csp.set("require-trusted-types-for", "script");
		csp.set("trusted-types", "allow-duplicates");
		csp.set("plugin-types", "application/pdf", "application/x-shockwave-flash");
		csp.set(
			"plugin-types",
			"application/x-java-applet",
			"application/x-shockwave-flash",
		);
		csp.set("report-to", "csp-endpoint");
	});
	test("getter: rules", (context): void => {
		context.assert.snapshot(csp.rules);
	});
	test("getter: flags", (context): void => {
		context.assert.snapshot(csp.flags);
	});
	test("string snapshot", (context): void => {
		context.assert.snapshot(csp.toString());
	});
	test("json snapshot", (context): void => {
		context.assert.snapshot(csp.toJSON());
	});
	test("table snapshot", (context): void => {
		deepEqual(csp.toTable(), [
			["rules", csp.rules],
			["flags", csp.flags],
		]);
		context.assert.snapshot(csp.toTable());
	});
});

describe("load", (): void => {
	test("load directives from a CSP header value", (context): void => {
		const header = [
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' *.example.com https://example.com",
			"style-src 'self' *.example.com https://example.com",
			"img-src * data:",
			"upgrade-insecure-requests",
			"require-trusted-types-for 'script'",
			"trusted-types 'allow-duplicates'",
			"plugin-types application/pdf application/x-shockwave-flash application/x-java-applet",
			"report-to csp-endpoint",
		].join("; ");
		const csp = new ContentSecurityPolicyManager();
		csp.load(header);
		const output = csp.toString();
		notEqual(output, header);
		// equals when sorted
		deepEqual(
			...([output, header].map((list) =>
				list
					.split(";")
					.map((string) => string.trim().split(" ").sort().join(" "))
					.sort()
					.join("; "),
			) as [string, string]),
		);
	});
});

describe("adjust", (): void => {
	test("adjust directives based on reports", (context): void => {
		const csp = new ContentSecurityPolicyManager();
		csp.adjust(...(reports as CSPViolationReport["body"][]));
		context.assert.snapshot(csp.toTable());
	});
});

describe("validateTrustedTypes", (): void => {
	const cases: [string, boolean][] = [
		["none", true],
		["allow-duplicates", true],
		["foo", true],
		["this&that", false],
		["something with space", false],
	];
	cases.forEach(([value, expected]): void => {
		test(`Validate Trusted Types: ${value}`, (): void => {
			equal(validateTrustedTypes(value), expected);
		});
	});
});
