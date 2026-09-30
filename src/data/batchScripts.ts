// Generated script data is shared by the browser and server downloads.
import pythonInstaller from './pythonInstaller';
export const INSTALL_PYTHON_BAT = pythonInstaller;
export { START_PRAJ_BAT, KILL_PRAJ_BAT, PRAJ_MASTER_SWITCH_BAT, PRAJ_SWITCH_BAT } from './windowsScripts';

export function downloadScriptFile(filename: string, content: string) {
  const windowsContent = content.replace(/\r?\n/g, '\r\n');
  const blob = new Blob([windowsContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
