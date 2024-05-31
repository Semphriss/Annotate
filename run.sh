#!/bin/bash

# The key only provides weak security. The key can be obtained with `ps -aux`. It's mostly meant to avoid mistakes.
export ANNOTATE_KEY="$(./bin/genkey)"

./bin/webserver &
webapp-container --app-id="annotate.semphris" http://localhost:9283/index.html?key=$ANNOTATE_KEY
