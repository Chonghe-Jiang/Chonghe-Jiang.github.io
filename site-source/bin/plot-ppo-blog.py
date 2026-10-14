"""Render the downloadable research figure from the public aggregate data."""

import json
from pathlib import Path

import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'assets/data/ppo-ttt/trajectories.json').read_text())
plt.rcParams.update({
    'font.family': 'DejaVu Sans', 'font.size': 10,
    'axes.spines.top': False, 'axes.spines.right': False,
    'axes.edgecolor': '#d5d9df', 'text.color': '#252a34',
    'axes.labelcolor': '#444a55', 'xtick.color': '#606976',
    'ytick.color': '#606976', 'pdf.fonttype': 42,
})
fig, axes = plt.subplots(1, 3, figsize=(15, 4.3))
panels = [
    ('best', 30, 'Best score · first 30 rounds', 'Best observed score', (75, 81)),
    ('best', 119, 'Best score · full trajectories', 'Best observed score', (75, 81)),
    ('valid5', 119, 'Validity · trailing five rounds', 'Valid programs (%)', (0, 100)),
]
for ax, (metric, end, title, ylabel, ylim) in zip(axes, panels):
    for series in data['series']:
        rows = [r for r in series['rounds'] if r['round'] <= end]
        ax.plot([r['round'] for r in rows], [r[metric] for r in rows],
                color=series['color'], linestyle='--' if series['dash'] else '-',
                linewidth=2, label=series['label'])
        ax.scatter(rows[-1]['round'], rows[-1][metric], s=20,
                   color=series['color'], zorder=3)
    ax.set(title=title, xlabel='Completed round', ylabel=ylabel,
           xlim=(1, end), ylim=ylim)
    ax.grid(axis='y', color='#e9ecf0', linewidth=0.7)
    ax.set_axisbelow(True)
handles, labels = axes[0].get_legend_handles_labels()
fig.legend(handles, labels, loc='lower center', ncol=2, frameon=False,
           bbox_to_anchor=(0.5, 0.045))
fig.text(0.5, 0.014,
         'One trajectory per configuration · 128 candidates per round · Online 70-case evaluator',
         ha='center', fontsize=9, color='#606976')
fig.tight_layout(rect=(0, 0.14, 1, 1))
output = root / 'assets/img/blog/ppo-trajectories'
fig.savefig(output.with_suffix('.png'), dpi=170, facecolor='white')
fig.savefig(output.with_suffix('.pdf'), facecolor='white',
            metadata={'Title': 'PPO and Guidance-TTT trajectories'})
print(f'Wrote {output}.png and .pdf')
