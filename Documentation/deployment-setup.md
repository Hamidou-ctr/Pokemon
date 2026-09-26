# Automatisches Deployment (GitHub Actions → CloudPanel)

Jeder Push auf `main` startet den Workflow `.github/workflows/deploy.yml`. Er lädt die
Seite per `rsync` über SSH auf den Server und prüft danach, ob die Seite antwortet.
Einen Build-Schritt gibt es nicht.

> **Das Repository ist öffentlich.** Server-IP, Benutzername, Pfad und Schlüssel stehen
> deshalb nie im Repo, weder im Code noch in dieser Doku. Hier stehen nur Platzhalter
> (`<SERVER-IP>`, `<SITE-USER>`, `<DOCROOT>`). Die echten Werte liegen in den
> GitHub-Secrets und auf dem Server.

## Sicherheitskonzept

| Risiko | Gegenmaßnahme |
| --- | --- |
| Fremder Code (Fork/PR) greift Secrets ab | Workflow läuft nur bei Push auf `main` und manuell, nie bei `pull_request`. Secrets liegen im Environment `production`, das nur für `main` freigegeben ist. |
| Key wird gestohlen | Der Key ist serverseitig per `rrsync -wo` eingeschränkt: nur Schreibzugriff auf das Web-Verzeichnis, keine Shell, kein Port-Forwarding, kein Lesen. Er läuft nicht als `root`. |
| Umleitung auf einen falschen Server | Der Host-Key des Servers ist im Secret `SSH_KNOWN_HOSTS` fest hinterlegt (`StrictHostKeyChecking=yes`). |
| Manipulierte Action (Supply Chain) | Actions sind per voller Commit-SHA gepinnt. Dependabot schlägt Updates als Pull Request vor. |
| Workflow hat zu viele Rechte | `permissions: {}` als Standard, der Job bekommt nur `contents: read`. Der Checkout speichert kein Token (`persist-credentials: false`). |
| Leerer Checkout löscht die Live-Seite | Vor dem Upload prüft der Workflow, ob `index.html`, `css/` und `js/` da sind. |
| Zugangsdaten landen im Repo | `.gitignore` blockiert Schlüsseldateien und `.env`. Secret Scanning mit Push Protection ist aktiviert (siehe unten). |

## Einmalige Einrichtung

### 1. Deploy-Key erzeugen (lokal, auf dem Mac)

Der Key gehört nur zu diesem Deployment und wird nirgends sonst benutzt.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/pokemon_deploy -C "github-actions-pokemon" -N ""
```

Das erzeugt `~/.ssh/pokemon_deploy` (privat) und `~/.ssh/pokemon_deploy.pub` (öffentlich).
Die private Datei nie ins Projektverzeichnis kopieren.

### 2. Öffentlichen Key eingeschränkt auf dem Server eintragen

Als `root` auf dem Server. Zuerst prüfen, dass `rrsync` vorhanden ist:

```bash
ls -l /usr/bin/rrsync
```

Fehlt es, `rsync` aktualisieren (`apt install --only-upgrade rsync`). Bei älteren Versionen
liegt das Skript unter `/usr/share/doc/rsync/scripts/rrsync.gz`.

Dann den Key mit Einschränkung eintragen (eine einzige Zeile in `authorized_keys2`):

```bash
cat >> /home/<SITE-USER>/.ssh/authorized_keys2 <<'EOF'
command="/usr/bin/rrsync -wo <DOCROOT>",restrict ssh-ed25519 AAAA... github-actions-pokemon
EOF
chown <SITE-USER>:<SITE-USER> /home/<SITE-USER>/.ssh/authorized_keys2
chmod 600 /home/<SITE-USER>/.ssh/authorized_keys2
ssh-keygen -lf /home/<SITE-USER>/.ssh/authorized_keys2   # Fingerprint muss zum Mac passen
sshd -T | grep authorizedkeysfile                        # muss authorized_keys2 enthalten
```

> **Nicht `authorized_keys` verwenden.** CloudPanel verwaltet diese Datei selbst und schreibt
> sie neu, sobald in den SSH-Einstellungen der Site etwas geändert wird (z. B. das Passwort).
> Ein dort von Hand eingetragener Key wird dabei gelöscht, und der Login schlägt danach mit
> `Permission denied (publickey,password)` fehl. `authorized_keys2` liest `sshd` ebenfalls
> (Standardeinstellung von Ubuntu), CloudPanel fasst sie nicht an.

`AAAA... github-actions-pokemon` ist der Inhalt von `pokemon_deploy.pub`.
`<DOCROOT>` ist das Web-Verzeichnis der Seite, z. B. `/home/<SITE-USER>/htdocs/<DOMAIN>`.

Was die Optionen bewirken:

- `command="…rrsync -wo <DOCROOT>"` erlaubt mit diesem Key nur rsync-Schreibzugriff auf
  genau dieses Verzeichnis. Der Server-Pfad im Workflow ist deshalb einfach `/`.
- `restrict` schaltet Shell/PTY, Port-Forwarding, Agent-Forwarding und X11 ab.

### 3. GitHub-Environment und Secrets anlegen

Repo → **Settings → Environments → New environment** → Name `production`:

- **Deployment branches and tags** → *Selected branches and tags* → nur `main`.
- Optional **Required reviewers** (du selbst). Dann wartet jedes Deployment auf deine Freigabe.

Dort unter **Environment secrets** anlegen:

| Name | Inhalt |
| --- | --- |
| `SSH_PRIVATE_KEY` | kompletter Inhalt von `~/.ssh/pokemon_deploy` (`pbcopy < ~/.ssh/pokemon_deploy`) |
| `SSH_KNOWN_HOSTS` | Ausgabe von `ssh-keyscan -t ed25519 <SERVER-IP>` |
| `SSH_HOST` | Server-IP oder Hostname |
| `SSH_USER` | Site-User, also nicht `root` |

Den Host-Key von `ssh-keyscan` am besten gegen den Fingerprint auf dem Server prüfen
(`ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`).

Danach die lokale Schlüsseldatei sichern oder löschen. Sie wird nur noch für eine
Rotation gebraucht.

### 4. Repository-Einstellungen

- **Settings → Actions → General**
  - *Fork pull request workflows from outside collaborators* → **Require approval for all outside collaborators**
  - *Workflow permissions* → **Read repository contents and packages permissions**
  - *Allow GitHub Actions to create and approve pull requests* → aus
  - Falls vorhanden: **Require actions to be pinned to a full-length commit SHA** → an
- **Settings → Code security**: **Secret scanning** und **Push protection** aktivieren.
  Beides ist bei öffentlichen Repos kostenlos.
- **Settings → Rules → Rulesets** (oder Branch protection) für `main`: **Block force pushes**
  und **Restrict deletions**.
- **GitHub-Account**: Zwei-Faktor-Authentifizierung aktivieren, am besten mit Passkey oder
  Hardware-Key. Ein übernommener Account macht alle Schutzmaßnahmen im Repo wirkungslos.

### 5. Deployment auslösen

Push auf `main` oder im Repo unter **Actions → Deploy → Run workflow**.

## Fehlersuche

- **`Permission denied (publickey,password)`**: Der Server kennt den Key nicht (mehr).
  Auf dem Server `ssh-keygen -lf /home/<SITE-USER>/.ssh/authorized_keys2` ausführen. Der
  Fingerprint muss zu `ssh-keygen -lf ~/.ssh/pokemon_deploy.pub` auf dem Mac passen. Steht
  der Key nur in `authorized_keys`, hat CloudPanel ihn eventuell überschrieben (siehe Schritt 2).
- **Meldung von `rrsync` über eine abgelehnte Option**: rrsync erlaubt nur bestimmte
  rsync-Optionen. Die Meldung steht im Log des Schritts „Dateien hochladen". Die
  betroffene Option im Workflow entfernen oder ersetzen.
- **`Host key verification failed`**: `SSH_KNOWN_HOSTS` stimmt nicht zum Server.
  Neu erzeugen und dabei den Fingerprint prüfen.
- **Schritt „Seite prüfen" schlägt fehl, Upload war aber ok**: Zertifikat oder DNS der
  Domain in CloudPanel prüfen.

## Key rotieren oder sperren

Wenn der Verdacht besteht, dass der Key oder das GitHub-Konto kompromittiert ist:

1. Die Zeile in `/home/<SITE-USER>/.ssh/authorized_keys2` löschen. Damit ist der Zugang sofort tot.
2. Secrets im Environment löschen.
3. Neuen Key erzeugen und ab Schritt 1 wiederholen.

## Gut zu wissen

- `rsync --delete` löscht auf dem Server alles, was nicht im Repo liegt. Dateien, die nur
  auf dem Server liegen, gehen beim nächsten Deployment verloren.
- Nicht hochgeladen werden `.git`, `.github`, `.vscode`, `.gitignore`, `Dokumentation`,
  `plan.drawio`, `up.sh`, `.DS_Store`. Der Ordner `.well-known/` (Let's Encrypt) bleibt
  unberührt. Weitere Ausnahmen kommen als `--exclude` in den Workflow.
- `up.sh` (pull, commit, push) löst damit automatisch ein Deployment aus.
- Rollback: den fehlerhaften Commit mit `git revert` zurücknehmen und pushen.
- Neue Zugangsdaten (API-Keys usw.) gehören nie ins Repo. Bei Aufnahme eines Backends
  kommen sie als weitere Environment-Secrets dazu.
