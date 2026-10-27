"""Refresh the bundled 2026 official holiday snapshot. No participant data is read.

Run from any directory with Python 3. This developer command uses the network;
the browser application only imports the generated local JavaScript module.
"""
from collections import defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path
import urllib.parse
import urllib.request

YEAR = '2026'
BASE = 'https://analisi.transparenciacatalunya.cat/resource/'


def fetch(dataset):
    query = urllib.parse.urlencode({'$limit': 10000, '$where': f"any_calendari='{YEAR}'"})
    with urllib.request.urlopen(f'{BASE}{dataset}.json?{query}', timeout=30) as response:
        return json.load(response)


def build_snapshot():
    local = fetch('b4eh-r8up')
    general = fetch('yf2b-mjr6')
    cities = {}
    dates = defaultdict(set)
    for row in local:
        code = row.get('codi_municipal', '')
        name = row.get('ajuntament_o_nucli_municipal', '')
        date = row.get('data', '')[:10]
        if not (len(code) == 8 and code.isdigit() and name and name not in ['null', 'C. A. de Catalunya'] and row.get('festiu') == 'Festiu local' and date.startswith(YEAR + '-')):
            raise ValueError('Unexpected municipal holiday row; review the official source before publishing.')
        datetime.strptime(date, '%Y-%m-%d')
        cities[code] = name
        dates[code].add(date)
    if len(cities) < 900 or any(len(ds) > 2 for ds in dates.values()):
        raise ValueError('Municipal coverage is incomplete or ambiguous; snapshot was not overwritten.')
    general_dates = sorted({r['data'][:10] for r in general if r.get('localitzaci') == 'Catalunya'})
    if len(general_dates) != 12:
        raise ValueError('Unexpected general holiday count; snapshot was not overwritten.')
    snapshot = {
        'year': YEAR,
        'checkedOn': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        'localSource': 'https://analisi.transparenciacatalunya.cat/d/b4eh-r8up',
        'generalSource': 'https://analisi.transparenciacatalunya.cat/d/yf2b-mjr6',
        'general': general_dates,
        'cities': {code: {'name': cities[code], 'dates': sorted(dates[code])} for code in sorted(cities)},
    }
    target = Path(__file__).resolve().parents[1] / 'holiday-data.mjs'
    target.write_text('// Generated from Generalitat de Catalunya open data. See scripts/refresh-holidays.py.\nexport const HOLIDAY_DATA = ' + json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    print(f'Bundled {len(cities)} settlements, {sum(map(len, dates.values()))} local dates, and {len(general_dates)} general dates for {YEAR}.')


if __name__ == '__main__':
    build_snapshot()
