#!/bin/bash -

echo "Content-type: text/plain"
echo

FILENAME="$(echo "$QUERY_STRING" | tr '&' '\n' | grep -E "^file=.*" | head -1 | cut -d = -f 2- | tr -d '\n' | tr -cs 'a-zA-Z0-9_-' '_')"

if [ "${REQUEST_METHOD^^}" = "GET" ] && [ -f "$HOME/.local/share/annotate/$FILENAME" ]; then
  rm $HOME/.local/share/annotate/$FILENAME
fi
