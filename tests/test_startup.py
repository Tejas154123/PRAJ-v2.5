import ast
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import Mock

ROOT = Path(__file__).resolve().parents[1]


class BridgeStartupTests(unittest.TestCase):
    def setUp(self):
        source = ast.parse((ROOT / 'praj_desktop_bridge.py').read_text(encoding='utf-8'))
        function = next(n for n in source.body if isinstance(n, ast.FunctionDef) and n.name == 'start_server')
        self.server = Mock()
        self.server.serve_forever.side_effect = KeyboardInterrupt
        self.factory = Mock(return_value=self.server)
        self.browser = Mock()
        self.namespace = dict(ServerClass=self.factory, PrajBridgeHandler=object,
                              BRIDGE_PORT=5000, os=Mock(environ={}),
                              webbrowser=self.browser, WEB_APP_URL='http://localhost:3000')
        exec(compile(ast.Module(body=[function], type_ignores=[]), '<startup>', 'exec'), self.namespace)

    def test_bind_failure_does_not_open_browser_or_report_readiness(self):
        self.factory.side_effect = OSError('port occupied')
        with self.assertRaisesRegex(OSError, 'port occupied'):
            self.namespace['start_server']()
        self.browser.open.assert_not_called()

    def test_foreground_server_closes_on_interrupt(self):
        with self.assertRaises(KeyboardInterrupt):
            self.namespace['start_server']()
        self.server.server_close.assert_called_once()

    def test_launcher_suppresses_early_browser_open(self):
        self.namespace['os'].environ = {'PRAJ_NO_BROWSER': '1'}
        with self.assertRaises(KeyboardInterrupt):
            self.namespace['start_server']()
        self.browser.open.assert_not_called()


@unittest.skipUnless(os.name == 'nt', 'Windows shell integration')
class WindowsLauncherTests(unittest.TestCase):
    def test_powershell_payloads_parse(self):
        for name in ('START_PRAJ.bat', 'INSTALL_PYTHON.bat'):
            env = dict(os.environ, PRAJ_TEST_FILE=str(ROOT / name))
            result = subprocess.run(['powershell.exe', '-NoProfile', '-Command',
                "$ErrorActionPreference='Stop'; $s=[IO.File]::ReadAllText($env:PRAJ_TEST_FILE); "
                "[void][scriptblock]::Create(($s -split '(?m)^# PRAJ_POWERSHELL_START\\r?$',2)[1])"],
                env=env, capture_output=True, text=True, timeout=20)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_missing_project_stays_diagnostic_in_special_character_path(self):
        with tempfile.TemporaryDirectory(prefix="PRAJ & (test) '") as directory:
            launcher = Path(directory) / 'START_PRAJ.bat'
            launcher.write_bytes((ROOT / 'START_PRAJ.bat').read_bytes())
            result = subprocess.run(f'cmd.exe /d /c ""{launcher}""',
                stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=30)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Extract the full repository ZIP', result.stdout)
            self.assertNotIn('was unexpected at this time', result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
