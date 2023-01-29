# Double Colon Conceal ![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/msrch/obsidian-double-colon-conceal) ![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22double-colon-conceal%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

[Obsidian](https://obsidian.md/) plugin to display double colon
([Dataview](https://github.com/blacksmithgu/obsidian-dataview)) as a single
colon in reading view (preview mode) for more natural experience.

![Example](https://raw.githubusercontent.com/msrch/obsidian-double-colon-conceal/master/example.png)

## Install

It is recomened to restart Obsidian after installing and enabling this plugin to
prevent any render caching issues.

### Community Plugins in Obsidian

Not yet available -
[review](https://github.com/obsidianmd/obsidian-releases/pull/1582/) pending.

In the mean time you can try this plugin using
[BRAT - Beta Reviewers Auto-update Tester](https://obsidian.md/plugins?id=obsidian42-brat) -
please follow
[the instructions provided by BRAT repo](https://github.com/TfTHacker/obsidian42-brat#adding-a-beta-plugin).

### Manual installation

1. Download following files from the
   [latest release](https://github.com/msrch/obsidian-double-colon-conceal/releases/latest):
   - [`manifest.json`](https://github.com/msrch/obsidian-double-colon-conceal/releases/latest/download/manifest.json)
   - [`main.js`](https://github.com/msrch/obsidian-double-colon-conceal/releases/latest/download/main.js)
1. Go to plugins directory in your Obsidian vault -
   `{{vault-root}}/.obsidian/plugins`
1. Create new directory `obsidian-double-colon-conceal`
1. Put the `manifest.json` and `main.js` into the new directory  
   `{{vault-root}}/.obsidian/plugins/obsidian-double-colon-conceal`
1. Open Obsidian app and enable the "Double Colon Conceal" plugin in the
   "Community plugins" in the "Settings"
