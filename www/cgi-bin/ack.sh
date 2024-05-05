#!/bin/bash -

KEY="$(echo "$QUERY_STRING" | tr '&' '\n' | grep -E "^key=.*" | head -1 | cut -d = -f 2- | tr -d '\n')"
if [ "$KEY" != "$ANNOTATE_KEY" ]; then
  exit 1
fi

echo "Content-type: text/plain"
echo

rm -r ~/.cache/annotate.semphris/HubIncoming/*

echo "Acked"
