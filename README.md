# dbt-streamdeck

The `dbt-streamdeck` Stream Deck plugin enables you to view the status of models and jobs as actions in your Stream Deck.

## Quick Start Guide

A short guide to help you get started quickly.

### Clone the repo

`git clone https://github.com/nicholasyager/dbt-streamdeck`

### SymLink to your Stream Deck plugin library

Create a symbolic link of the plugin's folder inside of the Stream Decks Plugins folder.

Windows SymLink

```console
# Note: this works inside the cmd, not on PowerShell
# %cd% gets the full absolute path to the plugin folder
mklink /D C:\Users\%USERNAME%\AppData\Roaming\Elgato\StreamDeck\Plugins\com.nicholasyager.dbt-streamdeck.sdPlugin %cd%\src\com.nicholasyager.dbt-streamdeck.sdPlugin
```

MacOs SymLink

```console
# Using $(pwd) to get the full absolute path to the plugin folder
ln -s $(pwd)/src/com.nicholasyager.dbt-streamdeck.sdPlugin ~/Library/Application\ Support/com.elgato.StreamDeck/Plugins/
```
