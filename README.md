# Chonghe Jiang’s homepage

Live site: https://chonghe-jiang.github.io/

The site uses the original [al-folio template](https://github.com/alshedivat/al-folio), with custom layouts and styles.
`site-source/provenance.json` records the template version, design reference, content sources, and paper figures.
The template retains its MIT license. Photographs and paper figures retain their original ownership.

## Update the site

The editable Jekyll source is in `site-source/`:

- `_pages/about.md`: introduction and research background.
- `_bibliography/papers.bib`: BibTeX records.
- `_data/publications.yml`: all papers, working papers, summaries, figures, and categories.
- `_data/research_categories.yml`: category names and order on the homepage.
- `_pages/bio.md`: education, service, awards, and other activities.
- `assets/css/homepage.css`: custom styles.

The source uses Ruby 3.3 and Bundler. From the repository root:

```sh
cd site-source
bundle install
bin/build-site
cd ..
```

The build copies static files to the repository root. It preserves the existing photos, slides, and legacy pages.
Preview the result with `python3 -m http.server 8080` from the repository root.
After review, commit the changed source and generated files, then push to `master`.
GitHub Pages publishes the root of `master`. The `.nojekyll` file disables a second Jekyll build.

The old `/publications/` URL redirects to the research section on the homepage.

## Local HTML

After a build, run these commands from `site-source/`:

```sh
python3 -m pip install -r requirements-local.txt
python3 bin/export-local.py
```

The exporter writes `homepage.html` in the repository root. This file includes the homepage and Bio page and their assets for offline use.

## Previous site

The repository history contains the previous homepage. Existing `photos/`, `slides/`, and legacy HTML files remain available.
The obsolete `CNAME` file named `chonghe.site`. The new deployment uses the GitHub Pages URL above.
