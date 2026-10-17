#!/bin/bash
# Get current date and time in format: YYYY-MM-DD HH:MM:SS
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Update the sketch.js file with new timestamp
sed -i '' "s/^\/\/ Last updated: .*/\/\/ Last updated: $TIMESTAMP/" js/sketch.js

# Also update the BUILD_TIME constant
sed -i '' "s/const BUILD_TIME = .*/const BUILD_TIME = \"$TIMESTAMP\";/" js/sketch.js

echo "✓ Timestamp updated to: $TIMESTAMP"
