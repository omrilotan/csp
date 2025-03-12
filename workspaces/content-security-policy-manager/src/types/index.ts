import { CSPDirectives, CSPSourceKeywords, flags } from "../constants/index.ts";

/**
 * Trusted Types restrict usage of known DOM XSS sink
 */
export type CSPTrustedType = "none" | "allow-duplicates" | string;

/**
 * MIME type of a plugin <type>/<subtype> (e.g. application/pdf)
 */
export type CSPPluginType = string;

/**
 * Source
 */
export type CSPSource = ArrayElement<typeof CSPSourceKeywords> | string;

/**
 * CSP flags affect the entire policy
 */
export type CSPFlag = ArrayElement<typeof flags>;

/**
 * Generic Reporting Framework
 * @see https://www.w3.org/TR/reporting-1/#serialize-reports
 */
export interface Report {
	/**
	 * @see https://www.w3.org/TR/reporting-1/#report-type
	 */
	type: string;
	url: string;
	/**
	 * The fields contained in a report’s body are determined by the report’s type.
	 * @see https://www.w3.org/TR/reporting-1/#report-body
	 */
	body: ReportBody;
	/**
	 * The number of milliseconds between report’s timestamp and the current time.
	 * We use relative timestamps to avoid clock skew between the client and the server.
	 */
	age?: number;
	/**
	 * Time at which the report was generated, in milliseconds since the unix epoch.
	 */
	timestamp?: number;
	user_agent?: string;
	/**
	 * The name of the endpoint that the report will be sent to.
	 */
	destination?: string;
	/**
	 * A non-negative integer representing the number of times the user agent attempted to deliver the report.
	 */
	attempts?: number;
}

/**
 * @see https://www.w3.org/TR/reporting-1/#reportbody
 */
interface ReportBody {
	toJSON(): Record<string, any>;
	[key: string]: any;
}

export interface CSPViolationReport extends Report {
	type: "csp-violation";
	body: CSPViolationReportBody;
}

/**
 * @see https://w3c.github.io/webappsec-csp/#cspviolationreportbody
 */
interface CSPViolationReportBody extends ReportBody {
	readonly sourceFile: string;
	readonly lineNumber: string | number;
	readonly columnNumber: string | number;
	/**
	 * The disposition of the policy
	 */
	readonly disposition: "report" | "enforce";
	/**
	 * Violation's resource
	 */
	readonly blockedURL: string;
	readonly documentURL: string;
	readonly effectiveDirective: ArrayElement<typeof CSPDirectives>;
	/**
	 * The full serialised policy that was violated
	 */
	readonly originalPolicy: string;
	readonly referrer: string;
	/**
	 * The first 40 characters of an inline script, event handler, or style that caused an violation
	 */
	readonly sample: string;
	readonly statusCode: string | number;
}
