# 🍎 Rappel quotidien sur Mac — installation

Le LaunchAgent `eu.mondevis.rappel-quotidien` fait exécuter `rappel.py`
**tous les jours à 05:30** avec une notification macOS (son "Glass").

## ✅ Déjà installé et vérifié (30/08/2026)

- `.plist` copié dans `~/Library/LaunchAgents/`
- `launchctl load` effectué — `launchctl list | grep mondevis` → OK
- Test manuel réussi : `launchctl start` → log OK dans `/tmp/mondevis-rappel.log`
- Heure mise à **05:30** le 30/08/2026 (rechargé et vérifié)

**Rien à faire.** Chaque matin à 05:30, une notification macOS affiche
le rappel du jour (post à publier, relances, messages à traiter).

## Tester manuellement

```bash
python3 "/Users/macwdbsequoia/Desktop/dossier Freebuff/mondevis/automation/rappel.py"
```

Options : `--semaine` (vue des 7 prochains jours), `--quiet` (sans notification).

## Vérifier que l'agent tourne

```bash
launchctl list | grep mondevis        # doit afficher: -  0  eu.mondevis.rappel-quotidien
cat /tmp/mondevis-rappel.log          # dernière exécution
```

Forcer une exécution immédiate :

```bash
launchctl start eu.mondevis.rappel-quotidien
```

## Désinstaller

```bash
launchctl unload ~/Library/LaunchAgents/eu.mondevis.rappel-quotidien.plist
rm ~/Library/LaunchAgents/eu.mondevis.rappel-quotidien.plist
```

> ⚠️ Si tu déplaces le dossier du projet, édite les chemins dans le
> `.plist` (les deux lignes `<string>` de `ProgramArguments`), puis :
> `launchctl unload` + `launchctl load` à nouveau.
