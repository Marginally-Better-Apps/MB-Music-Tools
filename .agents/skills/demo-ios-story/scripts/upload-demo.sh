#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <demo-video>" >&2
  exit 2
fi

video_path="$1"

if [[ ! -f "$video_path" ]]; then
  echo "Demo video does not exist: $video_path" >&2
  exit 1
fi

content_type="$(file --brief --mime-type "$video_path")"

if [[ "$content_type" != video/* ]]; then
  echo "Expected a video file, found $content_type: $video_path" >&2
  exit 1
fi

file_size="$(wc -c < "$video_path" | tr -d ' ')"

if (( file_size > 1048576 )); then
  echo "Demo video exceeds the tested 1 MiB Planista media limit: $video_path" >&2
  exit 1
fi

demo_url="$(curl --fail-with-body -sS -H "Content-Type: $content_type" --data-binary "@$video_path" https://planista.shloklab.us/)"

if [[ "$demo_url" != http://* && "$demo_url" != https://* ]]; then
  echo "Planista returned an unexpected response: $demo_url" >&2
  exit 1
fi

echo "$demo_url"
