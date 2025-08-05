#!/usr/bin/env bash

code=0

NODE_OPTIONS="--experimental-test-coverage --experimental-test-snapshots"

while [[ $# -gt 0 ]]; do
	case $1 in
	-h|--help)
		echo "Usage: $0 [--help] [--update-snapshots]"
		echo "Run tests with Node.js, optionally updating snapshots."
		echo "Options:"
		echo "  -h, --help                Show this help message"
		echo "  -u, --update-snapshots    Update snapshots during tests"
		exit 0
		;;
	-u|--update-snapshots)
		NODE_OPTIONS="$NODE_OPTIONS --test-update-snapshots"
		shift
		;;
	*)
		echo "Unknown option: $1"
		echo "Use -h or --help for usage information."
		exit 1
		;;
	esac
done

NODE_NO_WARNINGS=1 node --test $NODE_OPTIONS$@ **/test.ts
code=$((code + $?))

if [ $code -ne 0 ]; then
	echo "Tests failed. To update snapshots run: npm t -- -u"
fi

exit $code
