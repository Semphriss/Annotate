#!/bin/bash -

KEY="$(echo "$QUERY_STRING" | tr '&' '\n' | grep -E "^key=.*" | head -1 | cut -d = -f 2- | tr -d '\n')"
if [ "$KEY" != "$ANNOTATE_KEY" ]; then
  exit 1
fi

echo "Content-type: text/plain"
echo

# Move files from the Content Hub to local files
find $HOME/.cache/annotate.semphris/HubIncoming/* -type f | while read i; do
  cleanname="$(basename "$i" | tr -cs '\n[a-zA-Z0-9]_-' '_' | tr -d '\n')"

  n=
  while [ -f $HOME/.local/share/annotate/"${cleanname}$n" ]; do
    n=$(($n + 1));
  done
  cleanname="${cleanname}$n"

  base64 -w 0 "$i" > $HOME/.local/share/annotate/$cleanname
done

rm -r ~/.cache/annotate.semphris/HubIncoming/*

# Return the list of files
if [ "${REQUEST_METHOD^^}" = "GET" ]; then
  mkdir -p $HOME/.local/share/annotate/
  cd $HOME/.local/share/annotate/
  ls -t
fi
