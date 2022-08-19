#!/bin/bash

cd www
python3 -m http.server --cgi --bind 127.0.0.1 9283 &
webapp-container --app-id="annotate.semphris" http://localhost:9283/
