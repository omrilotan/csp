import { describe, test } from "node:test";
import { equal } from "node:assert/strict";
import { quote, unquote } from "./index.ts";

describe("quote", (): void => {
	test("Wrap a string in single quotes", (): void => {
		equal(quote(" test test"), "'test test'");
	});
	test("Does not wrap a string in single quotes", (): void => {
		equal(quote("'test'"), "'test'");
	});
	test("Does not wrap a string in single quotes with spaces", (): void => {
		equal(quote("'test test "), "'test test'");
	});
});
describe("unquote", (): void => {
	test("Strip a string of single quotes", (): void => {
		equal(unquote("'test test'"), "test test");
	});
	test("Strip quotes from a padded string", (): void => {
		equal(unquote(" 'test test' "), "test test");
	});
	test("Does not strip", (): void => {
		equal(unquote("test"), "test");
	});
	test("strip a single quote", (): void => {
		equal(unquote("test test'"), "test test");
	});
});
