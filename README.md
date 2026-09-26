# The White Room

Nine quick attention and reaction games. Each game starts immediately and lasts 45 seconds. Scores appear at the end, and personal bests are saved in this browser. No account, install, or build step is needed.

## Run locally

Serve this directory with any static file server, for example:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Run the challenge-generator checks with `npm test`.

## Publish on GitHub Pages

Push the files in this directory to the root of a public `thewhiteroom` repository. In the repository's **Settings > Pages**, choose **Deploy from a branch**, `main`, and `/(root)`. The site will appear at `https://<username>.github.io/thewhiteroom/`.

The games are original exercises inspired by common attention-training mechanics. They are for play and practice, not a medical treatment or a validated cognitive assessment.
