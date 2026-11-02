"""Copies Kiln Courier's stylesheet (../FFCardGame/style.css) into src/kc/kc.css, scoped under .kc.

Every selector is prefixed with `.kc` (`:root`, `html` and `body` become `.kc` itself), animation
names get a `kc-` prefix, the bundled fonts are replaced by the @fontsource packages of the same
families (Cinzel, Cormorant Garamond), and image URLs point at the small WebPs from art/kc.mjs.
Re-run after FFCardGame's stylesheet changes:

    python scripts/kc-css.py
"""
import re
from pathlib import Path

here = Path(__file__).resolve().parent
src = (here / '..' / '..' / 'FFCardGame' / 'style.css').read_text(encoding='utf8')
out = here / '..' / 'src' / 'kc' / 'kc.css'

css = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
css = css.replace('KilnSerif', "'Cinzel'").replace('KilnText', "'Cormorant Garamond'")
css = css.replace("url('./assets/kiln-hall.png')", "url('../../art/src/kc/regulator-gallery.webp')")

frames = set(re.findall(r'@keyframes\s+([\w-]+)', css))


def scope_selector(sel: str) -> str:
    sel = sel.strip()
    if not sel:
        return sel
    for root in (':root', 'html', 'body'):
        if sel == root:
            return '.kc'
        if sel.startswith(root + ' ') or sel.startswith(root + ':') or sel.startswith(root + '.') or sel.startswith(root + '['):
            return '.kc' + sel[len(root):]
    return '.kc ' + sel


def rename_animations(body: str) -> str:
    def fix(m):
        value = m.group(2)
        for name in frames:
            value = re.sub(r'(?<![\w-])' + re.escape(name) + r'(?![\w-])', 'kc-' + name, value)
        return m.group(1) + value
    return re.sub(r'(animation(?:-name)?\s*:)([^;}]*)', fix, body)


def walk(text: str) -> str:
    res, i = [], 0
    while i < len(text):
        j = text.find('{', i)
        if j < 0:
            res.append(text[i:])
            break
        head = text[i:j].strip()
        depth, k = 1, j + 1
        while depth and k < len(text):
            if text[k] == '{':
                depth += 1
            elif text[k] == '}':
                depth -= 1
            k += 1
        body = text[j + 1:k - 1]
        if head.startswith('@font-face'):
            pass  # fonts come from @fontsource (imported by src/kc/mount.tsx)
        elif head.startswith('@keyframes'):
            name = head.split()[1]
            res.append(f'@keyframes kc-{name} {{{body}}}\n')
        elif head.startswith('@media') or head.startswith('@supports'):
            res.append(f'{head} {{\n{walk(body)}}}\n')
        elif head.startswith('@'):
            res.append(f'{head} {{{body}}}\n')
        else:
            selectors = ', '.join(scope_selector(s) for s in head.split(','))
            res.append(f'{selectors} {{{rename_animations(body)}}}\n')
        i = k
    return ''.join(res)


header = ('/* Kiln Courier\'s stylesheet (FFCardGame/style.css), scoped under .kc by scripts/kc-css.py.\n'
          '   Do not edit by hand: change FFCardGame and re-run the script; Cinderfold additions go in kc-local.css. */\n')
out.write_text(header + walk(css), encoding='utf8')
print(f'Wrote {out} ({len(frames)} animations renamed).')
