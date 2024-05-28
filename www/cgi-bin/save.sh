#!/bin/bash -

KEY="$(echo "$QUERY_STRING" | tr '&' '\n' | grep -E "^key=.*" | head -1 | cut -d = -f 2- | tr -d '\n')"
if [ "$KEY" != "$ANNOTATE_KEY" ]; then
  exit 1
fi

echo "Content-type: text/plain"
echo "Content-Length: 5"
echo

FILENAME="$(echo "$QUERY_STRING" | tr '&' '\n' | grep -E "^file=.*" | head -1 | cut -d = -f 2- | tr -d '\n' | tr -cs 'a-zA-Z0-9_-' '_')"

if [ "${REQUEST_METHOD^^}" = "POST" ] && [ ! "$FILENAME" = "" ] && [ ! "$FILENAME" = "cgi-bin" ]; then
  mkdir -p $HOME/.local/share/annotate/
  # FIXME: `cat` never quits, probably stdin isn't closed by python after the body is received
  cat > $HOME/.local/share/annotate/$FILENAME
fi

echo "Saved"
