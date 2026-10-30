# Accounts and passwords

How to add users and reset passwords on InfoRetriever (inforetriever.org, hosted on Render). Passwords are stored only as bcrypt hashes, so no one can look up an existing password, only set a new one.

There are two kinds of account:

- **Editors** (POETs) log in with a user name and can use every tab. The list of editors is part of the code.
- **Readers** (the public) create their own accounts on the login screen with their email address.

## Add a new editor

1. Add the person in four places in the code. The user name is lower case; the display name is how their name appears on POEMs.
   - `seed-users.js`: add `{ username: 'smith', displayName: 'Smith' }` to the `POETS` list.
   - `poem-model.js`: add `'Smith'` to `VALID_POETS`.
   - `public/app.js`: add `'Smith'` to `NEWER_AUTHORS` (or `MAIN_AUTHORS`). That puts them in the Browse author list once they have a POEM.
   - `public/index.html`: add `<option value="Smith">Smith</option>` to the POET dropdown (`poetSelect`).
2. Commit and push. Render redeploys automatically.
3. When the new version starts, the server creates the account and prints a one-time password in Render's **Logs** tab:
   ```
   username: smith        password: Ab3dE...
   ```
   If you miss it, open the service's **Shell** tab on Render and run:
   ```bash
   npm run seed
   ```
   This creates any missing editor accounts and shows their passwords. It doesn't touch accounts that already exist, so you can run it again safely.
4. Give the person the password privately: in person, by phone, or through a password manager, not by email or Slack. The first time they log in, they have to choose their own password.

## Reset an editor's password

Editors have no "forgot password" email. Open Render's **Shell** tab and run the line below. Change `Temp-pass-123` to a temporary password and `ebell` to their user name:

```bash
node -e "const b=require('bcryptjs'),db=require('./db');db.prepare('UPDATE users SET password_hash=?, must_change_password=1 WHERE username=?').run(b.hashSync('Temp-pass-123',10),'ebell');console.log('Password reset.')"
```

Give them the temporary password privately. They have to change it the next time they log in.

## Readers

Readers sign up on the login screen and confirm their email address from a link. They reset a forgotten password themselves with the emailed link. There is no command to create a reader with a default password.

To see or manage reader accounts, run these in Render's **Shell** tab:

```bash
npm run readers                              # all readers, newest first
npm run readers -- locked                    # locked readers only
npm run readers -- unlock name@example.com   # unlock an account and clear its usage history
npm run readers -- lock name@example.com     # lock an account
```

## Running these on your own computer

The same commands work in the `poem-app` folder on your computer, but they change the local test database there, not the live site. Changes to live accounts must be run in Render's **Shell** tab.
