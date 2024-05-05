#!/bin/bash -

KEY="$(echo "$QUERY_STRING" | tr '&' '\n' | grep -E "^key=.*" | head -1 | cut -d = -f 2- | tr -d '\n')"
if [ "$KEY" != "$ANNOTATE_KEY" ]; then
  exit 1
fi

echo "Content-type: text/plain"
echo

FILENAME="$(echo "$QUERY_STRING" | tr '&' '\n' | grep -E "^file=.*" | head -1 | cut -d = -f 2- | tr -d '\n' | tr -cs 'a-zA-Z0-9_-' '_')"
NEWFILENAME="$(echo "$QUERY_STRING" | tr '&' '\n' | grep -E "^newname=.*" | head -1 | cut -d = -f 2- | tr -d '\n' | tr -cs 'a-zA-Z0-9_-' '_')"

if [ "${REQUEST_METHOD^^}" = "GET" ] && [ ! "$FILENAME" = "" ] && [ ! "$FILENAME" = "cgi-bin" ] && [ ! "$NEWFILENAME" = "" ] && [ ! "$NEWFILENAME" = "cgi-bin" ] && [ -f "$HOME/.local/share/annotate/$FILENAME" ] && [ ! -f "$HOME/.local/share/annotate/$NEWFILENAME" ]; then
  mv $HOME/.local/share/annotate/$FILENAME $HOME/.local/share/annotate/$NEWFILENAME
fi
