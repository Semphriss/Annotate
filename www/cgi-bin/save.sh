#!/bin/bash -

echo "Content-type: text/plain"
echo "Content-Length: 5"
echo

FILENAME="$(echo "$QUERY_STRING" | tr '&' '\n' | grep -E "^file=.*" | head -1 | cut -d = -f 2- | tr -d '\n' | tr -cs 'a-zA-Z0-9_-' '_')"

if [ "${REQUEST_METHOD^^}" = "POST" ] && [ ! "$FILENAME" = "" ] && [ ! "$FILENAME" = "cgi-bin" ]; then
  mkdir -p $HOME/.local/share/annotate/
  cat > $HOME/.local/share/annotate/$FILENAME
fi

echo "Saved"
