# Double Colon Conceal ![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/msrch/obsidian-double-colon-conceal) ![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22double-colon-conceal%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

[Obsidian](https://obsidian.md/) plugin to display double colon (i.e.
[Dataview](https://github.com/blacksmithgu/obsidian-dataview)
[inline fields](https://blacksmithgu.github.io/obsidian-dataview/annotation/add-metadata/#inline-fields))
as a single colon for more natural reading experience.

## Reading View

![Reading view example](https://raw.githubusercontent.com/msrch/obsidian-double-colon-conceal/master/example-reading-view.png)

## Editing View

Double colon conceal for editing view is turned off by default. Turn it on in
the plugin settings if you wish to use it. When active the double colons will be
concealed in the live preview as well.

![Editing view example](https://raw.githubusercontent.com/msrch/obsidian-double-colon-conceal/master/example-editing-view.gif)

Double colon is not concealed:

- on active line (line where cursor is placed)
- within text selection
- in Source mode

Concealed double colon (single colon) has `.cm-double-colon-conceal` CSS class
attached that could be used to add custom styling. Red text colour was used
bellow for demonstration.

![Styling example](https://raw.githubusercontent.com/msrch/obsidian-double-colon-conceal/master/example-custom-style.png)

## Install

It is recommended to restart Obsidian after installing and enabling this plugin
to prevent any render caching issues. Also double check that the plugin is
enabled.

### Community Plugins in Obsidian

Plugin is available for download now -
[search](https://obsidian.md/plugins?search=Double+Colon+Conceal) for "Double
Colon Conceal".

### Manual installation

1. Download following files from the
   [latest release](https://github.com/msrch/obsidian-double-colon-conceal/releases/latest):
   - [`manifest.json`](https://github.com/msrch/obsidian-double-colon-conceal/releases/latest/download/manifest.json)
   - [`main.js`](https://github.com/msrch/obsidian-double-colon-conceal/releases/latest/download/main.js)
2. Go to plugins directory in your Obsidian vault -
   `{{vault-root}}/.obsidian/plugins`
3. Create new directory `obsidian-double-colon-conceal`
4. Put the `manifest.json` and `main.js` into the new directory  
   `{{vault-root}}/.obsidian/plugins/obsidian-double-colon-conceal`
5. Open Obsidian app and enable the "Double Colon Conceal" plugin in the
   "Community plugins" in the "Settings"
