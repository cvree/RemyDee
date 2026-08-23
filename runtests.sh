#!/bin/sh
# Every suite, one line each. `sh runtests.sh 33 34` runs only those.
list="${*:-6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42}"
fail=0
for t in $list; do
  printf 'test%s: ' "$t"
  out=$(node "test$t.js" 2>&1 | tail -1)
  echo "$out"
  case "$out" in PASS*) ;; *) fail=$((fail+1));; esac
done
echo "---"
[ "$fail" -eq 0 ] && echo "ALL GREEN" || echo "$fail SUITE(S) RED"
exit "$fail"
