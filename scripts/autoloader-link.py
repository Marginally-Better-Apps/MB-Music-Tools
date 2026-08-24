#!/usr/bin/env python3
"""Print Autoloader's hosted HTTPS install link for a public IPA URL."""

from urllib.parse import quote
import sys

SHIM = "https://marginally-better-apps.github.io/Autoloader/"


def https_link(ipa_url: str) -> str:
    return SHIM + "?url=" + quote(ipa_url, safe="")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: autoloader-link.py <ipa-url>")
    print(https_link(sys.argv[1]))
