#!/usr/bin/env bash

code=0

NODE_NO_WARNINGS=1 node --test --experimental-test-coverage --experimental-test-snapshots --experimental-strip-types $@ **/test.ts
code=$((code + $?))

if [ $code -ne 0 ]; then
	echo "Tests failed. To update snapshots run: npm t -- --test-update-snapshots"
fi

exit $code
