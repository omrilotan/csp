import {
	CSPPluginType,
	CSPSource,
	CSPTrustedType,
	CSPFlag,
	CSPViolationReport,
} from "./types/index.ts";
import {
	CSPDirectives,
	CSPSourceKeywords,
	CSPSourceExpressions,
	flags,
	TrustedTypesFlag,
	RequiredTrustedTypesForFlag,
	RequiredTrustedTypesForElements,
} from "./constants/index.ts";
import { quote, unquote } from "./quotes/index.ts";
import { validateTrustedTypes } from "./validateTrustedTypes/index.ts";
import { sortSources } from "./sortSources/index.ts";

export { CSPDirectives, CSPSourceKeywords };

/**
 * A Content Security Policy (CSP) structure
 */
export class ContentSecurityPolicyManager {
	#rules: Map<CSPSource, Set<ArrayElement<typeof CSPDirectives>>>;
	#flags: Map<CSPFlag, Set<string>>;

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
			if (flags.includes(directive as CSPFlag)) {
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
	set(name: "upgrade-insecure-requests"): this;
	set(name: "report-to", ...values: string[]): this;
	set(
		name: "plugin-types",
		...values: [CSPPluginType, ...CSPPluginType[]]
	): this;
	set(
		name: typeof TrustedTypesFlag,
		...values: [CSPTrustedType, ...CSPTrustedType[]]
	): this;
	set(
		name: typeof RequiredTrustedTypesForFlag,
		...values: [
			ArrayElement<typeof RequiredTrustedTypesForElements>,
			...ArrayElement<typeof RequiredTrustedTypesForElements>[],
		]
	): this;
	set(name: ArrayElement<typeof flags>, ...values: string[]): this {
		if (!this.#flags.has(name)) this.#flags.set(name, new Set());
		values = values.map(unquote);
		if (name === "report-to") {
			values.forEach((value) => {
				if (!/^[\w-_]+$/.test(unquote(value)))
					throw new Error(`Invalid value for report-to: ${value}`);
			});
		}
		if (name === TrustedTypesFlag) {
			values.forEach((value) => {
				if (!validateTrustedTypes(value))
					throw new Error(`Invalid value for trusted-types: ${value}`);
			});
		}
		if (name === RequiredTrustedTypesForFlag) {
			(values as typeof RequiredTrustedTypesForElements).forEach((value) => {
				if (!RequiredTrustedTypesForElements.includes(value))
					throw new Error(
						`Invalid value for require-trusted-types-for: ${value}`,
					);
			});
		}

		if ([TrustedTypesFlag, RequiredTrustedTypesForFlag].includes(name)) {
			values = values.map((value) => quote(value));
		}

		values.forEach((value) => this.#flags.get(name)?.add(value));
		return this;
	}

	/**
	 * Remove a flag
	 */
	erase(name: CSPFlag): this {
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
		flags: Record<CSPFlag | string, string[]>;
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
				]) => [scope, Array.from(directives)],
			)
			.sort(sortSources as any) as [
			CSPSource,
			ArrayElement<typeof CSPDirectives>[],
		][];
	}

	/**
	 * Get the flags in a sorted array
	 */
	get flags(): [CSPFlag, string[]][] {
		return Array.from(this.#flags).map(([directive, values]) => [
			directive,
			Array.from(values),
		]);
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
			Array.from(this.#rules).reduce(
				(accumulator, [source, directives]) => {
					directives.forEach((directive) => {
						if (!Object.hasOwn(accumulator, directive))
							accumulator[directive] = [];
						accumulator[directive].push(
							CSPSourceExpressions.includes(
								source as ArrayElement<typeof CSPSourceExpressions>,
							) || source.startsWith("nonce-")
								? quote(source)
								: source,
						);
					});
					return accumulator;
				},
				{} as Record<ArrayElement<typeof CSPDirectives>, CSPSource[]>,
			),
		).map(([directive, sources]) => [directive, sources.join(" ")].join(" "));
		const generalRules = Array.from(this.#flags).map(([directive, values]) =>
			[directive, ...Array.from(values)].join(" "),
		);
		return rules.concat(generalRules).join("; ");
	}
}
