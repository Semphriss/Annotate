#!/bin/bash

cd www

# The key only provides weak security. The key can be obtained with `ps -aux`. It's mostly meant to avoid mistakes.
export ANNOTATE_KEY="$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 64)"

python3 -m http.server --cgi --bind 127.0.0.1 9283 &
webapp-container --app-id="annotate.semphris" http://localhost:9283/?key=$ANNOTATE_KEY
