#!/usr/bin/env python3
"""Tests for Autoloader's hosted install link, not a local trampoline page."""

import importlib.util
from pathlib import Path
import unittest


SCRIPT = Path(__file__).with_name("autoloader-link.py")
SPEC = importlib.util.spec_from_file_location("autoloader_link", SCRIPT)
assert SPEC and SPEC.loader
link = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(link)


class AutoloaderLinkTests(unittest.TestCase):
    def test_uses_autoloaders_hosted_shim(self) -> None:
        ipa = "https://github.com/org/repo/releases/download/pr-12/MB-Music-Tools-unsigned.ipa"
        url = link.https_link(ipa)
        self.assertTrue(
            url.startswith("https://marginally-better-apps.github.io/Autoloader/?url=")
        )
        self.assertIn("https%3A%2F%2Fgithub.com%2Forg%2Frepo", url)
        self.assertNotIn("url=https://", url)
        self.assertNotIn("/MB-Music-Tools/pr/", url)

    def test_script_does_not_emit_html(self) -> None:
        source = SCRIPT.read_text()
        self.assertNotIn("<!DOCTYPE html>", source)
        self.assertNotIn("location.replace", source)


if __name__ == "__main__":
    unittest.main()
