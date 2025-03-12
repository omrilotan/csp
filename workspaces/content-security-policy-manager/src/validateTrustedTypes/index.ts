import { CSPTrustedType } from "../types/index.ts";

/**
 * Validate values for the trusted-types directive
 */
export const validateTrustedTypes = (value: CSPTrustedType): boolean =>
	["none", "allow-duplicates"].includes(value) ||
	/^[\w-\#=_\/@\.\%]+$/.test(value);
