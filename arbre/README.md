# Arbre familiar

Visor de consulta amb zoom per a GitHub Pages. Les dades i la fotografia es distribueixen xifrades; la contrasenya no s'inclou al repositori.

## Estructura

- `index.html`, `acces.js`, `acces.css` i `icon.svg`: pantalla d'accés i desxifrat al navegador.
- `dades.xifrades.json`: document de consulta xifrat amb AES-256-GCM i clau derivada amb PBKDF2-SHA256.
- `scripts/preparar.mjs`: preparació local de la versió de consulta i del fitxer xifrat.
- `local/`: arbres editables, dades, fotos i generadors de cada família. Aquesta carpeta està exclosa de Git i no es publica.

## Editar i preparar una actualització

1. Obre `local/llop/arbre-genealogic.html`, edita les fitxes i desa la còpia actualitzada dins la carpeta local.
2. Executa `node arbre/scripts/preparar.mjs` des de l'arrel del repositori. El programa demana el camí del document quan es passa `--source` i la contrasenya de manera interactiva; no la desa. Sense `--source`, utilitza el document local de Llop.
3. Revisa i prova els canvis abans de publicar-los. El programa genera únicament el document xifrat i la pantalla d'accés; no copia dades personals en clar al repositori.

Exemple amb una còpia editada:

```powershell
node arbre/scripts/preparar.mjs --source arbre/local/llop/arbre-genealogic-editat.html
```

Per automatitzar proves locals es pot utilitzar `--password-stdin`, passant la contrasenya per l'entrada estàndard. No la passis com a argument de línia d'ordres ni l'afegeixis a cap fitxer versionat.

`tests/verificar.mjs` comprova el xifrat, la integritat, les exclusions de Git i el flux complet al navegador. Rep la contrasenya per stdin i utilitza Playwright amb Microsoft Edge; es pot seleccionar un altre navegador amb `BROWSER_EXECUTABLE`. Les captures de comprovació es desen a `tmp/`, exclosa de Git.

La publicació a GitHub es fa només després d'una petició explícita de push, d'acord amb `AGENTS.md`. El visor estarà disponible a `/ai-public-utils/arbre/` quan es publiqui el canvi.

## Protecció i límits

GitHub Pages només serveix fitxers estàtics. Per això l'accés protegeix el contingut amb xifrat, en lloc d'amagar dades en clar darrere d'un formulari. La contrasenya i la clau es mantenen en memòria mentre s'obre el document; no es guarden al navegador.

La versió pública no inclou controls d'edició ni cap servei d'escriptura. Qui coneix la contrasenya pot consultar i copiar el contingut desxifrat. El xifrat no impedeix provar contrasenyes fora de línia; una contrasenya llarga i imprevisible ofereix més protecció.
