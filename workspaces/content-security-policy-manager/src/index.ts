import type {
	CSPPluginType,
	CSPSource,
	CSPTrustedType,
	CSPViolationReport,
} from "./types/index.ts";
import {
	CSPDirectives,
	CSPSourceKeywords,
	CSPSourceExpressions,
	CSPFlags,
	TrustedTypesFlag,
	RequiredTrustedTypesForFlag,
	RequiredTrustedTypesForElements,
} from "./constants/index.ts";
import { quote, quoteSource, unquote } from "./quotes/index.ts";
import { validateTrustedTypes } from "./validateTrustedTypes/index.ts";
import { sortSources } from "./sortSources/index.ts";
import { removeRedundantSources } from "./removeRedundantSources/index.ts";

export { CSPFlags, CSPDirectives, CSPSourceKeywords };

/**
 * A Content Security Policy (CSP) structure
 */
export class ContentSecurityPolicyManager {
	#rules: Map<CSPSource, Set<ArrayElement<typeof CSPDirectives>>>;
	#flags: Map<ArrayElement<typeof CSPFlags>, Set<string>>;

	constructor() {
		this.#rules = new Map();
		this.#flags = new Map();
	}

	/**
	 * Load a CSP header into the CSP manager instance
	 */
	load(header: string): this {
		header.split(";").forEach((rule) => {
			const [directive, ...sources] = rule.trim().split(" ");
			if (CSPFlags.includes(directive as ArrayElement<typeof CSPFlags>)) {
				this.set(directive as any, ...sources);
			} else {
				sources.forEach((source) =>
					this.add(source, directive as ArrayElement<typeof CSPDirectives>),
				);
			}
		});
		return this;
	}

	/**
	 * Adjust the CSP based on a violation reports
	 */
	adjust(...records: Partial<CSPViolationReport["body"]>[]): this {
		records.forEach((record) => {
			const { effectiveDirective, blockedURL } = record;
			if (!effectiveDirective || !blockedURL) return;
			this.add(
				blockedURL.startsWith("http")
					? new URL(blockedURL).hostname
					: blockedURL,
				effectiveDirective,
			);
		});
		return this;
	}

	/**
	 * Add a directive to a scope
	 */
	add(
		scope: CSPSource,
		...directives: ArrayElement<typeof CSPDirectives>[]
	): this {
		if (directives.length === 0) return this;
		if (!this.#rules.has(scope)) this.#rules.set(scope, new Set());
		directives.forEach((directive) => this.#rules.get(scope)?.add(directive));
		return this;
	}

	/**
	 * Remove a a complete scope or specific directives from a scope
	 */
	remove(
		scope: CSPSource,
		...directives: ArrayElement<typeof CSPDirectives>[]
	): this {
		if (!this.#rules.has(scope)) return this;
		if (directives.length === 0) {
			this.#rules.delete(scope);
		} else {
			directives.forEach((directive) =>
				this.#rules.get(scope)?.delete(directive),
			);
		}
		return this;
	}

	/*
	 * Set a flag
	 */
	set(name: "upgrade-insecure-requests", ...values: unknown[]): this;
	set(name: "report-to", ...values: NonEmptyArray<string>): this;
	set(name: "plugin-types", ...values: NonEmptyArray<CSPPluginType>): this;
	set(
		name: typeof TrustedTypesFlag,
		...values: NonEmptyArray<CSPTrustedType>
	): this;
	set(
		name: typeof RequiredTrustedTypesForFlag,
		...values: NonEmptyArray<
			ArrayElement<typeof RequiredTrustedTypesForElements>
		>
	): this;
	set(name: ArrayElement<typeof CSPFlags>, ...values: string[]): this {
		if (!this.#flags.has(name)) this.#flags.set(name, new Set());
		values = values.map(unquote);

		// Validations
		switch (name) {
			case "plugin-types":
				// TODO: Validate plugin types
				break;
			case "upgrade-insecure-requests":
				if (values.length > 0)
					throw new Error(
						`upgrade-insecure-requests does not accept any values, got: ${values.join(", ")}`,
					);
				break;
			case "report-to":
				if (values.length === 0)
					throw new Error("report-to requires at least one value");
				values.forEach((value) => {
					if (!/^[\w-_]+$/.test(unquote(value)))
						throw new Error(`Invalid value for report-to: ${value}`);
				});
				break;
			case TrustedTypesFlag:
				if (values.length === 0)
					throw new Error("trusted-types requires at least one value");
				values.forEach((value) => {
					if (!validateTrustedTypes(value))
						throw new Error(`Invalid value for trusted-types: ${value}`);
				});
				values = values.map((value) => quote(value));
				break;
			case RequiredTrustedTypesForFlag:
				if (values.length === 0)
					throw new Error(
						"require-trusted-types-for requires at least one value",
					);
				(values as typeof RequiredTrustedTypesForElements).forEach((value) => {
					if (!RequiredTrustedTypesForElements.includes(value))
						throw new Error(
							`Invalid value for require-trusted-types-for: ${value}`,
						);
				});
				values = values.map((value) => quote(value));
				break;
		}
		values.forEach((value) => this.#flags.get(name)?.add(value));
		return this;
	}

	/**
	 * Remove a flag
	 */
	erase(name: ArrayElement<typeof CSPFlags>): this {
		this.#flags.delete(name);
		return this;
	}

	/**
	 * Remove all directives and flags
	 */
	clear(): this {
		this.#rules.clear();
		this.#flags.clear();
		return this;
	}

	/**
	 * Expose the structure of the underlying Map
	 */
	toJSON(): {
		rules: Record<CSPSource, ArrayElement<typeof CSPDirectives>[]>;
		flags: Record<ArrayElement<typeof CSPFlags> | string, string[]>;
	} {
		return {
			rules: Object.fromEntries(
				Array.from(this.#rules).map(([source, directives]) => [
					source,
					Array.from(directives),
				]),
			),
			flags: Object.fromEntries(
				Array.from(this.#flags).map(([flag, values]) => [
					flag,
					Array.from(values),
				]),
			),
		};
	}

	/**
	 * Get the rules in a sorted array
	 */
	get rules(): [CSPSource, typeof CSPDirectives][] {
		return Array.from(this.#rules)
			.map(
				([scope, directives]: [
					CSPSource,
					Set<ArrayElement<typeof CSPDirectives>>,
				]) => [scope, Array.from(directives).sort()],
			)
			.sort(sortSources as any) as [
			CSPSource,
			ArrayElement<typeof CSPDirectives>[],
		][];
	}

	/**
	 * Get the flags in a sorted array
	 */
	get flags(): [ArrayElement<typeof CSPFlags>, string[]][] {
		return Array.from(this.#flags)
			.map(([directive, values]) => [directive, Array.from(values).sort()])
			.sort(([a], [b]) => (a as string).localeCompare(b as string)) as [
			ArrayElement<typeof CSPFlags>,
			string[],
		][];
	}

	/**
	 * Expose the structure of the underlying Map as an array of tuples
	 */
	toTable(): [
		["rules", ContentSecurityPolicyManager["rules"]],
		["flags", ContentSecurityPolicyManager["flags"]],
	] {
		return [
			["rules", this.rules],
			["flags", this.flags],
		];
	}

	/**
	 * Serialize a Content-Security-Policy header value
	 */
	toString(): string {
		const rules = Object.entries(
			this.rules.reduce(
				(accumulator, [source, directives]) => {
					directives.forEach((directive) => {
						if (!Object.hasOwn(accumulator, directive))
							accumulator[directive] = [];
						accumulator[directive].push(
							quoteSource(source as ArrayElement<typeof CSPSourceExpressions>),
						);
					});
					return accumulator;
				},
				{} as Record<ArrayElement<typeof CSPDirectives>, CSPSource[]>,
			),
		)
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([directive, sources]) =>
				[directive, removeRedundantSources(sources.sort().join(" "))].join(" "),
			);

		const flags = this.flags.map(([directive, values]) =>
			[directive, ...values].join(" "),
		);

		return rules.concat(flags).join("; ");
	}
}
