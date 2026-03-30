#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Open URL in Container
# @raycast.mode silent

# Optional parameters:
# @raycast.packageName Auto Multi-Account Containers
# @raycast.icon ../icons/icon-64.png
# @raycast.argument1 { "type": "dropdown", "placeholder": "Container target", "data": [{"title": "Slot 1", "value": "slot:1"}, {"title": "Slot 2", "value": "slot:2"}, {"title": "Slot 3", "value": "slot:3"}, {"title": "Slot 4", "value": "slot:4"}, {"title": "Slot 5", "value": "slot:5"}, {"title": "Slot 6", "value": "slot:6"}, {"title": "Slot 7", "value": "slot:7"}, {"title": "Slot 8", "value": "slot:8"}, {"title": "Slot 9", "value": "slot:9"}] }
# @raycast.argument2 { "type": "text", "placeholder": "https://example.com", "percentEncoded": true }
# @raycast.description Open a URL in a managed Firefox container by sending ext+automac directly to Firefox.
# @raycast.author xfx

target="$1"
encoded_url="$2"

if [[ -z "$target" ]]; then
  echo "Missing container target"
  exit 1
fi

if [[ -z "$encoded_url" ]]; then
  echo "Missing URL"
  exit 1
fi

case "$target" in
  slot:*)
    query="slot=${target#slot:}"
    ;;
  profile:*)
    query="profileId=${target#profile:}"
    ;;
  *)
    echo "Unsupported container target: $target"
    exit 1
    ;;
esac

if ! open -a "Firefox" "ext+automac://open?${query}#${encoded_url}"; then
  echo "Failed to hand the link to Firefox. Make sure Firefox is installed and named Firefox.app."
  exit 1
fi
