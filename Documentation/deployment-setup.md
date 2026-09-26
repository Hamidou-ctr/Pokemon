# Automatic Deployment (GitHub Actions → CloudPanel)

Every push to `main` starts the workflow `.github/workflows/deploy.yml`. It uploads the
site to the server via `rsync` over SSH and then checks that the site responds.
There is no build step.

> **The repository is public.** The server IP, user name, path and key are therefore
> never in the repo, neither in the code nor in this documentation. Only placeholders
> appear here (`<SERVER-IP>`, `<SITE-USER>`, `<DOCROOT>`). The real values live in the
> GitHub secrets and on the server.

## Security concept

| Risk | Countermeasure |
| --- | --- |
| Foreign code (fork/PR) steals secrets | The workflow only runs on a push to `main` and manually, never on `pull_request`. Secrets live in the `production` environment, which is only released for `main`. |
| The key is stolen | The key is restricted server-side via `rrsync -wo`: write access to the web directory only, no shell, no port forwarding, no reading. It does not run as `root`. |
| Redirect to a wrong server | The server's host key is stored permanently in the secret `SSH_KNOWN_HOSTS` (`StrictHostKeyChecking=yes`). |
| Tampered action (supply chain) | Actions are pinned to a full commit SHA. Dependabot proposes updates as pull requests. |
| The workflow has too many permissions | `permissions: {}` as the default; the job only gets `contents: read`. The checkout does not store a token (`persist-credentials: false`). |
| An empty checkout deletes the live site | Before the upload, the workflow checks that `index.html`, `css/` and `js/` exist. |
| Credentials end up in the repo | `.gitignore` blocks key files and `.env`. Secret scanning with push protection is enabled (see below). |

## One-time setup

### 1. Generate a deploy key (locally, on the Mac)

The key belongs only to this deployment and is not used anywhere else.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/pokemon_deploy -C "github-actions-pokemon" -N ""
```

This creates `~/.ssh/pokemon_deploy` (private) and `~/.ssh/pokemon_deploy.pub` (public).
Never copy the private file into the project directory.

### 2. Add the public key to the server with restrictions

As `root` on the server. First check that `rrsync` is available:

```bash
ls -l /usr/bin/rrsync
```

If it is missing, upgrade `rsync` (`apt install --only-upgrade rsync`). On older versions
the script is located at `/usr/share/doc/rsync/scripts/rrsync.gz`.

Then add the key with the restriction (a single line in `authorized_keys2`):

```bash
cat >> /home/<SITE-USER>/.ssh/authorized_keys2 <<'EOF'
command="/usr/bin/rrsync -wo <DOCROOT>",restrict ssh-ed25519 AAAA... github-actions-pokemon
EOF
chown <SITE-USER>:<SITE-USER> /home/<SITE-USER>/.ssh/authorized_keys2
chmod 600 /home/<SITE-USER>/.ssh/authorized_keys2
ssh-keygen -lf /home/<SITE-USER>/.ssh/authorized_keys2   # the fingerprint must match the Mac
sshd -T | grep authorizedkeysfile                        # must contain authorized_keys2
```

> **Do not use `authorized_keys`.** CloudPanel manages this file itself and rewrites it
> as soon as something is changed in the site's SSH settings (e.g. the password).
> A key added there by hand is deleted in the process, and the login then fails with
> `Permission denied (publickey,password)`. `sshd` also reads `authorized_keys2`
> (Ubuntu default setting); CloudPanel does not touch it.

`AAAA... github-actions-pokemon` is the content of `pokemon_deploy.pub`.
`<DOCROOT>` is the site's web directory, e.g. `/home/<SITE-USER>/htdocs/<DOMAIN>`.

What the options do:

- `command="…rrsync -wo <DOCROOT>"` only allows rsync write access to exactly this
  directory with this key. The server path in the workflow is therefore simply `/`.
- `restrict` disables shell/PTY, port forwarding, agent forwarding and X11.

### 3. Create the GitHub environment and secrets

Repo → **Settings → Environments → New environment** → name `production`:

- **Deployment branches and tags** → *Selected branches and tags* → only `main`.
- Optionally **Required reviewers** (yourself). Every deployment then waits for your approval.

Create the following under **Environment secrets**:

| Name | Content |
| --- | --- |
| `SSH_PRIVATE_KEY` | full content of `~/.ssh/pokemon_deploy` (`pbcopy < ~/.ssh/pokemon_deploy`) |
| `SSH_KNOWN_HOSTS` | output of `ssh-keyscan -t ed25519 <SERVER-IP>` |
| `SSH_HOST` | server IP or host name |
| `SSH_USER` | site user, i.e. not `root` |

It is best to verify the host key from `ssh-keyscan` against the fingerprint on the server
(`ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`).

Afterwards, back up or delete the local key file. It is only needed again for a
rotation.

### 4. Repository settings

- **Settings → Actions → General**
  - *Fork pull request workflows from outside collaborators* → **Require approval for all outside collaborators**
  - *Workflow permissions* → **Read repository contents and packages permissions**
  - *Allow GitHub Actions to create and approve pull requests* → off
  - If available: **Require actions to be pinned to a full-length commit SHA** → on
- **Settings → Code security**: enable **Secret scanning** and **Push protection**.
  Both are free for public repos.
- **Settings → Rules → Rulesets** (or branch protection) for `main`: **Block force pushes**
  and **Restrict deletions**.
- **GitHub account**: enable two-factor authentication, ideally with a passkey or
  hardware key. A hijacked account makes all protective measures in the repo useless.

### 5. Trigger a deployment

Push to `main`, or in the repo under **Actions → Deploy → Run workflow**.

## Troubleshooting

- **`Permission denied (publickey,password)`**: The server does not (or no longer) know the key.
  Run `ssh-keygen -lf /home/<SITE-USER>/.ssh/authorized_keys2` on the server. The
  fingerprint must match `ssh-keygen -lf ~/.ssh/pokemon_deploy.pub` on the Mac. If the key
  is only in `authorized_keys`, CloudPanel may have overwritten it (see step 2).
- **Message from `rrsync` about a rejected option**: rrsync only allows certain
  rsync options. The message is in the log of the "Upload files" step. Remove or replace
  the affected option in the workflow.
- **`Host key verification failed`**: `SSH_KNOWN_HOSTS` does not match the server.
  Regenerate it and verify the fingerprint while doing so.
- **The "Check site" step fails although the upload was OK**: Check the certificate or DNS of
  the domain in CloudPanel.

## Rotating or revoking the key

If you suspect that the key or the GitHub account has been compromised:

1. Delete the line in `/home/<SITE-USER>/.ssh/authorized_keys2`. This kills access immediately.
2. Delete the secrets in the environment.
3. Generate a new key and repeat from step 1.

## Good to know

- `rsync --delete` deletes everything on the server that is not in the repo. Files that exist
  only on the server are lost at the next deployment.
- `.git`, `.github`, `.vscode`, `.gitignore`, `Documentation`, `plan.drawio`, `up.sh` and
  `.DS_Store` are not uploaded. The `.well-known/` folder (Let's Encrypt) is left
  untouched. Further exceptions are added as `--exclude` in the workflow.
- `up.sh` (pull, commit, push) therefore triggers a deployment automatically.
- Rollback: undo the faulty commit with `git revert` and push.
- New credentials (API keys etc.) never belong in the repo. If a backend is added,
  they are added as further environment secrets.
