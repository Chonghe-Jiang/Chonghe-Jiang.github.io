"""Export aggregate public chart data for PPO and Guidance-TTT."""

import argparse
import csv
import json
import statistics
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('history_dir', type=Path)
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'assets/data/ppo-ttt')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
series = []
flat = []
for key, label, color, dash in [
    ('grpo', 'Guidance-TTT', '#16836b', ''),
    ('ppo', 'PPO', '#4169b1', ''),
]:
    source = json.loads((args.history_dir / f'{key}-progress.json').read_text())
    rows = []
    best = 0.0
    for i, row in enumerate(source):
        metrics = row['metrics']
        assert row['round'] == i, (key, i, row['round'])
        assert len(row['scores']) == 128, (key, i)
        best = max(best, max(row['scores']))
        window = source[max(0, i-4):i+1]
        public = {
            'round': i+1, 'candidates': len(row['scores']), 'best': best,
            'mean': statistics.mean(row['scores']),
            'valid': 100 * metrics['quality/program_valid_fraction'],
            'compile_failure': 100 * metrics['quality/compile_failure_fraction'],
            'parse_failure': 100 * metrics['quality/parse_failure_fraction'],
            'mean5': statistics.mean(x for r in window for x in r['scores']),
            'valid5': 100 * statistics.mean(r['metrics']['quality/program_valid_fraction'] for r in window),
        }
        rows.append(public)
        flat.append({'method': key, **public})
    series.append({'id': key, 'label': label, 'color': color, 'dash': dash, 'rounds': rows})
data = {
    'task': 'FrontierCS Polyomino packing',
    'date': '2026-10-14',
    'definitions': {
        'round': 'One-based completed round; source progress round is zero-based.',
        'best': 'Maximum observed raw score through this round.',
        'mean': 'Raw candidate mean including failures.',
        'valid': 'Verifier program-valid percentage.',
        'compile_failure': 'Compilation failure percentage.',
        'parse_failure': 'Parsing failure percentage.',
        'mean5': 'Candidate mean over the trailing five rounds, fewer at the start.',
        'valid5': 'Trailing five-round mean program-valid percentage, fewer at the start.',
    },
    'limitations': 'One run per configuration; same online 70-case evaluator, no held-out scores. Equal candidate slots do not imply equal compute. Full runs have different lengths.',
    'series': series,
}
(args.output / 'trajectories.json').write_text(json.dumps(data, indent=2) + '\n')
with (args.output / 'round-metrics.csv').open('w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=list(flat[0]), lineterminator='\n')
    writer.writeheader()
    writer.writerows(flat)
print(f'Exported {len(flat)} completed rounds across {len(series)} runs.')
