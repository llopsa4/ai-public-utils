// Export and import of save files.
import { t } from '../engine/i18n';
import { loadChapterOf } from '../chapters';
import { MAX_SAVE_BYTES, parseSave, saveFileName, serializeSave } from '../engine/saveFile';
import { $, type Ui } from './ui';

export function exportSave(ui: Ui): void {
  if (ui.host.isBusy()) return;
  const now = new Date();
  const blob = new Blob([serializeSave(ui.host.getState(), now)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = saveFileName(now);
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  ui.toast(t('ui.exported'));
}

export async function importSave(ui: Ui): Promise<void> {
  const file = ui.fileInput.files?.[0];
  ui.fileInput.value = '';
  if (!file) return;
  const text = file.size > MAX_SAVE_BYTES ? '' : await file.text();
  if (text) await loadChapterOf(text);
  const result = file.size > MAX_SAVE_BYTES ? { ok: false as const, error: 'save.error.tooLarge' } : parseSave(text);
  if (!result.ok) { ui.toast(t(result.error), 6000); return; }
  if (!$('app').classList.contains('on-title') && !(await ui.confirm(t('ui.confirmImport')))) return;
  ui.host.replaceState(result.state);
  ui.menu.close();
  ui.toast(t('ui.imported'));
}
