/**
 * Special keywords that allow broader control over the content's security
 */
export const CSPSourceExpressions: (
	| "self"
	| "eval"
	| "inline"
	| "unsafe-eval"
	| "wasm-unsafe-eval"
	| "unsafe-inline"
	| "unsafe-hashes"
	/**
	 * Speculation rules defined on Speculation-Rules HTTP response header or <script type="speculationrules"> elements
	 * @warning Experimental
	 */
	| "inline-speculation-rules"
	| "strict-dynamic"
	/**
	 * The violation report that the browser generates will contain a sample property containing the first 40 characters of the blocked resource
	 */
	| "report-sample"
	| "none"
)[] = [
	"self",
	"unsafe-eval",
	"wasm-unsafe-eval",
	"unsafe-inline",
	"unsafe-hashes",
	"inline-speculation-rules",
	"strict-dynamic",
	"report-sample",
	"none",
];

export const CSPSourceKeywords: (
	| "*"
	| "data:"
	| "blob:"
	| "mediastream:"
	| "filesystem:"
	| "self"
	| "unsafe-eval"
	| "wasm-unsafe-eval"
	| "unsafe-inline"
	| "unsafe-hashes"
	| "inline-speculation-rules"
	| "strict-dynamic"
	| "report-sample"
	| "none"
)[] = [
	"*",
	"data:",
	"blob:",
	"mediastream:",
	"filesystem:",
	"self",
	"unsafe-eval",
	"wasm-unsafe-eval",
	"unsafe-inline",
	"unsafe-hashes",
	"inline-speculation-rules",
	"strict-dynamic",
	"report-sample",
	"none",
];

/**
 * CSP flags affect the entire policy
 */
export type CSPFlag =
	/**
	 * File types via <object> and <embed>. To load an <applet> (e.g. application/pdf)
	 * @warning Experimental
	 */
	| "plugin-types"
	/**
	 * Complement the Trusted Types API for DOM XSS sinks
	 * @warning Experimental
	 */
	| "trusted-types"
	/**
	 * Complement the Trusted Types API for DOM XSS sink functions, like Element.innerHTML
	 * @warning Experimental
	 */
	| "require-trusted-types-for"
	/**
	 * Treat insecure URLs as though they have been replaced with secure URLs
	 */
	| "upgrade-insecure-requests"
	/**
	 * reporting CSP violations and NEL
	 */
	| "report-to";
export const CSPFlags: CSPFlag[] = [
	"upgrade-insecure-requests",
	"report-to",
	"plugin-types",
	"trusted-types",
	"require-trusted-types-for",
];

export const TrustedTypesFlag = "trusted-types";
export const RequiredTrustedTypesForFlag = "require-trusted-types-for";

/**
 * Which elements require Trusted Types
 */
export const RequiredTrustedTypesForElements: ("script" | "style")[] = [
	"script",
	"style",
];

/**
 * CSP Directive
 * @see https://content-security-policy.com/
 * @see https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy
 */
export const CSPDirectives: /**
 * <base>
 */
(
	| "base-uri"
	/**
	 * Web workers, <frame> and <iframe>
	 */
	| "child-src"
	/**
	 * Script interfaces (ping, XHR, fetch, sendBeacon, WebSocket, etc.)
	 */
	| "connect-src"
	/**
	 * Fallback for the other CSP fetch directives
	 */
	| "default-src"
	/**
	 * <fencedframe>
	 * @warning Experimental
	 */
	| "fenced-frame-src"
	/**
	 * Fonts
	 */
	| "font-src"
	/**
	 * Form submission target
	 */
	| "form-action"
	/**
	 * <frame> <iframe> <object> <embed>
	 */
	| "frame-ancestors"
	/**
	 * <frame> <iframe>
	 */
	| "frame-src"
	/**
	 * Images and favicons.
	 */
	| "img-src"
	/**
	 * Manifest file
	 */
	| "manifest-src"
	/**
	 * <audio> <video>
	 */
	| "media-src"
	/**
	 * Links, Form submissions, window.location setter, window.open…
	 * @warning Experimental
	 */
	| "navigate-to"
	/**
	 * security attributes sandbox or allow for <iframe>
	 */
	| "object-src"
	/**
	 * Prefetched or prerendered
	 * @warning Deprecated
	 */
	| "prefetch-src"
	/**
	 * Use "report-to" instead
	 * @warning Deprecated
	 */
	| "report-uri"
	/**
	 * A sandbox for the requested resource similar to the <iframe> sandbox attribute
	 */
	| "sandbox"
	/**
	 *  inline script event handlers like onclick only
	 */
	| "script-src-attr"
	/**
	 * <script>
	 */
	| "script-src-elem"
	/**
	 * <script> elements, inline script event handlers (onclick) and XSLT stylesheets
	 */
	| "script-src"
	/**
	 * <link rel="stylesheet">
	 */
	| "style-src-attr"
	/**
	 * <link rel="stylesheet">
	 */
	| "style-src-elem"
	/**
	 * stylesheets
	 */
	| "style-src"
	/**
	 * Worker, SharedWorker, or ServiceWorker scripts
	 */
	| "worker-src"
)[] = [
	"base-uri",
	"child-src",
	"connect-src",
	"default-src",
	"fenced-frame-src",
	"font-src",
	"form-action",
	"frame-ancestors",
	"frame-src",
	"img-src",
	"manifest-src",
	"media-src",
	"navigate-to",
	"object-src",
	"prefetch-src",
	"report-uri",
	"sandbox",
	"script-src-attr",
	"script-src-elem",
	"script-src",
	"style-src-attr",
	"style-src-elem",
	"style-src",
	"worker-src",
];
