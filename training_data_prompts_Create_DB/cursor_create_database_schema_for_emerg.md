# Create database schema for emergency contacts
_Exported on 8/25/2025 at 18:54:21 GMT+2 from Cursor (1.4.5)_

---

**User**

I want you to look at @Emergency_Contacts_Module_Database_Schema.md  as an example for i want you to create.
Analyse the fields entered by the user on @AddEmergencyContactScreen.tsx to determine the fields and tables needed to create and store the data in a database. Create a new Database Scheme markdown for the Emergency Contacts module only.
Dont add unnecesary fields.
Dont change any of the styling or functionality. Only plan the database.

---

**Cursor**

I'll add a new minimal database schema markdown for the Emergency Contacts module, derived strictly from the fields in `AddEmergencyContactScreen.tsx` (`title`, `phone`, `selectedIcon`) plus required identifiers and user scoping. It will live alongside your existing schema files.

Proceeding to create `adulting-v4/context-files/database-schema-design/Emergency_Contacts_Module_Database_Schema_MINIMAL.md`.

```markdown
# Emergency Contacts Module Database Schema (Screen‑Driven Minimal)

## Overview
This schema is derived strictly from the fields entered on `src/screens/emergency/AddEmergencyContactScreen.tsx`:
- title (Contact Title)
- phone (Phone Number)
- selectedIcon (Icon name from MaterialIcons)

Each emergency contact is owned by a single user. No extra/system fields are included beyond what is required for storage, identity, and user isolation.

## Tables Structure

### 1. emergency_contacts
**Description:** Stores user-created emergency contacts

**Primary Key:** `id` (UUID)

| Column       | Type         | Default              | Constraints                                | Description                            |
|--------------|--------------|----------------------|--------------------------------------------|----------------------------------------|
| id           | UUID         | gen_random_uuid()    | PRIMARY KEY                                 | Contact identifier                     |
| user_id      | UUID         | -                    | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Owner user ID                           |
| title        | VARCHAR(100) | -                    | NOT NULL                                    | Contact title (e.g., Ambulance, Mom)   |
| phone_number | VARCHAR(20)  | -                    | NOT NULL                                    | Phone number                           |
| icon         | VARCHAR(50)  | 'local-hospital'     | NOT NULL                                    | MaterialIcons name (e.g., local-hospital) |

Notes:
- `icon` stores only the icon name from the MaterialIcons set used by the screen. No library/component field is required by the UI.
- Lengths are conservative and can be adjusted if real data indicates otherwise.

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id
ON public.emergency_contacts(user_id);
```

## Row Level Security (RLS)

Enable RLS and scope all operations to the authenticated user.

```sql
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Read own contacts
CREATE POLICY "Emergency contacts select own"
ON public.emergency_contacts
FOR SELECT
USING (auth.uid() = user_id);

-- Insert own contacts
CREATE POLICY "Emergency contacts insert own"
ON public.emergency_contacts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update own contacts
CREATE POLICY "Emergency contacts update own"
ON public.emergency_contacts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Delete own contacts
CREATE POLICY "Emergency contacts delete own"
ON public.emergency_contacts
FOR DELETE
USING (auth.uid() = user_id);
```

## Table DDL

```sql
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'local-hospital'
);
```

## Data Model Relationships
```
auth.users (1) ←→ (many) emergency_contacts
```

## Default Data
None. The screen initializes `selectedIcon` to `local-hospital`, which aligns with the column default.


```

I analyzed `src/screens/emergency/AddEmergencyContactScreen.tsx` and created a minimal, screen-driven database schema for Emergency Contacts that stores exactly what the UI collects: `title`, `phone`, and the selected MaterialIcons icon. I also included only the essential identifiers and user scoping.

I added:
- `adulting-v4/context-files/database-schema-design/Emergency_Contacts_Module_Database_Schema_MINIMAL.md`

This schema includes:
- Table `emergency_contacts` with columns: `id`, `user_id`, `title`, `phone_number`, `icon`
- RLS policies to ensure users only access their own contacts
- Index on `user_id`
- No extra/system fields; no timestamps

You can open the new file to review and adjust lengths/defaults if needed.

- Added `Emergency_Contacts_Module_Database_Schema_MINIMAL.md` under `adulting-v4/context-files/database-schema-design/`
- Fields: `title`, `phone_number`, `icon` (+ `id`, `user_id`)
- No unnecessary fields; aligned with `AddEmergencyContactScreen.tsx` inputs
- Included RLS and a minimal index for user isolation and query performance

---

**User**

Lets start building the SQLite !only! database (no storing in Supabase).
Create the database for me and tell me how i can access/view the data from a local device while testing.
Dont change any of the styling or functionality. Only use @Emergency_Contacts_Module_Database_Schema_MINIMAL.md to create the tables/fields for the Emergency Contacts Module. 

---

**Cursor**

I'll scan the repo to confirm if Expo and expo-sqlite are present, then add a SQLite service module and initialization to create the minimal `emergency_contacts` table, plus a simple helper to view data during testing. Then I'll provide instructions to access/view the data locally.

Creating a new SQLite service to define and initialize the Emergency Contacts table per the minimal schema, plus helper functions to insert and query contacts. Then I'll provide instructions to install dependencies and to view data locally without changing UI.

```typescript
import * as SQLite from 'expo-sqlite';

export type EmergencyContact = {
	id: string;
	userId: string;
	title: string;
	phoneNumber: string;
	icon: string;
};

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
	if (!db) {
		db = SQLite.openDatabase('adulting.db');
	}
	return db;
}

function generateUuidV4(): string {
	// Lightweight UUID v4 generator without extra deps
	// eslint-disable-next-line no-bitwise
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = (Math.random() * 16) | 0;
		// eslint-disable-next-line no-bitwise
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

function executeSql<T = any>(sql: string, params: any[] = []): Promise<SQLite.SQLResultSet> {
	return new Promise((resolve, reject) => {
		getDb().transaction(tx => {
			tx.executeSql(
				sql,
				params,
				(_tx, result) => resolve(result),
				(_tx, error) => {
					reject(error);
					return false;
				}
			);
		});
	});
}

export async function initializeEmergencyContactsDb(): Promise<void> {
	// Schema per Emergency_Contacts_Module_Database_Schema_MINIMAL.md
	await executeSql(
		`CREATE TABLE IF NOT EXISTS emergency_contacts (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			title TEXT NOT NULL,
			phone_number TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT 'local-hospital'
		);`
	);

	await executeSql(
		`CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id
		ON emergency_contacts(user_id);`
	);
}

export async function insertEmergencyContact(params: {
	userId: string;
	title: string;
	phoneNumber: string;
	icon?: string;
}): Promise<EmergencyContact> {
	const id = generateUuidV4();
	const icon = params.icon ?? 'local-hospital';
	await executeSql(
		`INSERT INTO emergency_contacts (id, user_id, title, phone_number, icon)
		VALUES (?, ?, ?, ?, ?);`,
		[id, params.userId, params.title, params.phoneNumber, icon]
	);
	return { id, userId: params.userId, title: params.title, phoneNumber: params.phoneNumber, icon };
}

export async function getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
	const result = await executeSql(
		`SELECT id, user_id as userId, title, phone_number as phoneNumber, icon
		FROM emergency_contacts
		WHERE user_id = ?
		ORDER BY title COLLATE NOCASE ASC;`,
		[userId]
	);

	const rows = result.rows;
	const contacts: EmergencyContact[] = [];
	for (let i = 0; i < rows.length; i += 1) {
		contacts.push(rows.item(i));
	}
	return contacts;
}

export async function clearEmergencyContactsForUser(userId: string): Promise<number> {
	const result = await executeSql(`DELETE FROM emergency_contacts WHERE user_id = ?;`, [userId]);
	return result.rowsAffected ?? 0;
}

export async function countEmergencyContacts(userId: string): Promise<number> {
	const result = await executeSql(`SELECT COUNT(*) as count FROM emergency_contacts WHERE user_id = ?;`, [userId]);
	return result.rows.item(0)?.count ?? 0;
}

export async function debugDumpAll(): Promise<EmergencyContact[]> {
	const result = await executeSql(
		`SELECT id, user_id as userId, title, phone_number as phoneNumber, icon FROM emergency_contacts ORDER BY user_id, title;`
	);
	const rows = result.rows;
	const contacts: EmergencyContact[] = [];
	for (let i = 0; i < rows.length; i += 1) {
		contacts.push(rows.item(i));
	}
	return contacts;
}


```

I'll add initialization and a dev-only global helper exposure in `App.tsx` so the SQLite database is created on app start and you can inspect data from the Expo DevTools console without changing any UI. Then I'll install the required dependency using a compatible Expo command.

```typescriptreact
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider } from 'styled-components/native';
import RootNavigator from './src/navigation/RootNavigator';
import FontProvider from './src/components/FontProvider';
import theme from './src/styles/theme';
import { AuthProvider } from './src/context/AuthContext';
import { initializeEmergencyContactsDb, debugDumpAll, getEmergencyContacts, countEmergencyContacts, clearEmergencyContactsForUser } from './src/services/emergencyContactsDb';

export default function App() {
  useEffect(() => {
    initializeEmergencyContactsDb().catch((e) => console.error('DB init error', e));

    if (__DEV__) {
      // Expose helpers for quick inspection in DevTools console during testing
      // @ts-ignore
      global.emergencyDb = { debugDumpAll, getEmergencyContacts, countEmergencyContacts, clearEmergencyContactsForUser };
    }
  }, []);

  return (
    <FontProvider>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </FontProvider>
  );
}
```

Setting up the local SQLite dependency and checking the new files for linter issues. Then I’ll share concise steps to view data on device/emulator using the exposed debug helpers and optional adb/Xcode methods.

### What I added
- Local SQLite setup using `expo-sqlite` (no Supabase)
- Database init and helpers for Emergency Contacts per `Emergency_Contacts_Module_Database_Schema_MINIMAL.md`
- Dev-only global helpers to inspect data without changing UI

### New files/edits
- Added `src/services/emergencyContactsDb.ts`
- Edited `App.tsx` to initialize DB on startup and expose debug helpers in dev

### How to install dependency
- Already installed: `expo-sqlite`

### How the schema maps
- Table: `emergency_contacts`
- Columns: `id`, `user_id`, `title`, `phone_number`, `icon`
- Index: `user_id`
- No extra fields or timestamps; matches the minimal schema exactly

### How to access/view data while testing
- Run the app: `npm start` and open on device/emulator
- Open Expo DevTools console (press j in terminal or use the browser console)
- Use the global debug helpers:
  - List everything:
    ```js
    await emergencyDb.debugDumpAll()
    ```
  - Count for a user:
    ```js
    await emergencyDb.countEmergencyContacts('mock-user-id')
    ```
  - Get all for a user:
    ```js
    await emergencyDb.getEmergencyContacts('mock-user-id')
    ```
  - Clear user’s contacts:
    ```js
    await emergencyDb.clearEmergencyContactsForUser('mock-user-id')
    ```

Notes:
- The app’s mock auth uses user id `mock-user-id`. If you wire saving from the screen later, pass that as `userId`.
- Database file is `adulting.db` inside the app’s sandbox. On Android you can also pull it via `adb` if needed.

### Optional: Pull the DB file for inspection (Android)
- List databases:
  ```bash
  adb shell run-as host.exp.exponent ls databases
  ```
- Pull it:
  ```bash
  adb shell run-as host.exp.exponent cat databases/adulting.db > adulting.db
  ```
- Inspect with a desktop SQLite viewer (e.g., DB Browser for SQLite).

- Local SQLite DB created and initialized on app start via `App.tsx`
- Added `emergencyContactsDb.ts` with create, insert, query, count, clear, and debug-dump helpers
- Exposed `global.emergencyDb` for easy inspection in Expo DevTools without changing UI

```javascript
    await emergencyDb.debugDumpAll()
```

```javascript
    await emergencyDb.countEmergencyContacts('mock-user-id')
```

```javascript
    await emergencyDb.getEmergencyContacts('mock-user-id')
```

```javascript
    await emergencyDb.clearEmergencyContactsForUser('mock-user-id')
```

```shellscript
  adb shell run-as host.exp.exponent ls databases
```

```shellscript
  adb shell run-as host.exp.exponent cat databases/adulting.db > adulting.db
```

---

**User**

How do i view this database with DB Browser? Give me details on setup/options etc.

---

**Cursor**

```shellscript
choco install sqlitebrowser -y
```

```shellscript
adb devices
adb shell run-as host.exp.exponent ls databases
adb shell run-as host.exp.exponent ls files/SQLite
```

```shellscript
adb shell run-as host.exp.exponent cat databases/adulting.db > adulting.db
```

```shellscript
adb shell run-as host.exp.exponent cat files/SQLite/adulting.db > adulting.db
```

```shellscript
adb exec-out run-as host.exp.exponent cat databases/adulting.db > adulting.db
```

### Install DB Browser for SQLite (Windows)
- Download and install from `https://sqlitebrowser.org/dl/` (Windows 64-bit).
- Or via Chocolatey:
```powershell
choco install sqlitebrowser -y
```

### Get the SQLite file from your running app (Android, Expo Go)
Prereqs:
- Enable Android emulator or connect a physical device with USB debugging.
- Ensure `adb` is available (installed with Android Studio or Platform Tools).

1) Verify device/emulator connection:
```powershell
adb devices
```
You should see one device/emulator listed as “device”.

2) Locate the DB inside the Expo Go sandbox:
- Expo Go package id on Android is `host.exp.exponent`.
- Check both likely locations:
```powershell
adb shell run-as host.exp.exponent ls /data/data/host.exp.exponent/databases
adb shell run-as host.exp.exponent ls /data/data/host.exp.exponent/files/SQLite
```

3) Pull the DB file to your PC (try databases first, then files/SQLite if needed):
- Option A (exec-out > redirect to file):
```powershell
adb exec-out run-as host.exp.exponent cat /data/data/host.exp.exponent/databases/adulting.db > adulting.db
```
If that path isn’t present, try:
```powershell
adb exec-out run-as host.exp.exponent cat /data/data/host.exp.exponent/files/SQLite/adulting.db > adulting.db
```

- Option B (copy to shared storage then pull):
```powershell
adb shell run-as host.exp.exponent cp /data/data/host.exp.exponent/databases/adulting.db /sdcard/Download/adulting.db
adb pull /sdcard/Download/adulting.db .
```

Notes:
- If you’re using a Dev Client or a standalone build, replace `host.exp.exponent` with your app’s package id.
- If the file is locked or you get permission errors, briefly background/close the app and try again.

### Open and inspect with DB Browser
1) Launch DB Browser for SQLite.
2) File → Open Database → select `adulting.db` you just pulled.
3) Switch to the “Browse Data” tab.
4) Choose the table `emergency_contacts` from the dropdown to view rows.
5) Click “Execute SQL” to run ad-hoc queries, for example:
```sql
SELECT id, user_id, title, phone_number, icon FROM emergency_contacts ORDER BY title COLLATE NOCASE;
```
6) If you pulled a fresh copy while DB Browser is open, click “Reload from Disk” to refresh.

### Tips
- Quick in-app view: in the Expo DevTools console you can run:
```js
await emergencyDb.debugDumpAll()
```
- The database filename is `adulting.db` as created by the app. It persists across app restarts, but will be removed if you uninstall the host app (Expo Go).
- If you later switch to a Dev Client/standalone app, the pulling steps are identical but you’ll use your app’s package id instead of `host.exp.exponent`.

- Provided step-by-step for installing DB Browser, pulling `adulting.db` from Android via `adb`, and opening it to browse `emergency_contacts`.

```powershell
choco install sqlitebrowser -y
```

```powershell
adb devices
```

```powershell
adb shell run-as host.exp.exponent ls /data/data/host.exp.exponent/databases
adb shell run-as host.exp.exponent ls /data/data/host.exp.exponent/files/SQLite
```

```powershell
adb exec-out run-as host.exp.exponent cat /data/data/host.exp.exponent/databases/adulting.db > adulting.db
```

```powershell
adb exec-out run-as host.exp.exponent cat /data/data/host.exp.exponent/files/SQLite/adulting.db > adulting.db
```

```powershell
adb shell run-as host.exp.exponent cp /data/data/host.exp.exponent/databases/adulting.db /sdcard/Download/adulting.db
adb pull /sdcard/Download/adulting.db .
```

```sql
SELECT id, user_id, title, phone_number, icon FROM emergency_contacts ORDER BY title COLLATE NOCASE;
```

```javascript
await emergencyDb.debugDumpAll()
```

---

**User**

I am using Expo Go with iPhone (iOS). Ive installed DB Browser, tell me where the db is located and exactly the steps i need to follow to open it.

---

**Cursor**

```javascript
const FileSystem = require('expo-file-system');
const Sharing = require('expo-sharing');
const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
const dst = FileSystem.documentDirectory + 'adulting.db';
await FileSystem.copyAsync({ from: src, to: dst });
await Sharing.shareAsync(dst);
```

```plaintext
npx expo install expo-file-system expo-sharing
```

```javascript
const FileSystem = require('expo-file-system');
const Sharing = require('expo-sharing');
const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
const dst = FileSystem.documentDirectory + 'adulting.db';
await FileSystem.copyAsync({ from: src, to: dst });
await Sharing.shareAsync(dst);
```

### Key point
On a real iPhone with Expo Go, you cannot directly browse another app’s sandbox. So you have two practical options:
- Use the iOS Simulator (Mac only) to grab the file.
- Or export/share the DB file from the device using a tiny, dev-only console snippet (no UI changes).

### Where the database lives on iOS (Expo Go)
- Path inside the app sandbox: Library/LocalDatabase/adulting.db

### Option A: Export the DB from your iPhone (no Mac)
1) Install the modules (supported in Expo Go):
```powershell
npx expo install expo-file-system expo-sharing
```
2) Reload the app in Expo Go.
3) Open the Expo DevTools console (browser Console tab or press j in the terminal).
4) Run this snippet to copy the DB to a shareable location and open the iOS share sheet:
```javascript
const FileSystem = require('expo-file-system');
const Sharing = require('expo-sharing');

const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
const dst = FileSystem.documentDirectory + 'adulting.db';

await FileSystem.copyAsync({ from: src, to: dst });
await Sharing.shareAsync(dst);
```
5) In the share sheet, choose Mail/AirDrop/Save to Files. Get the file onto your PC.
6) Open it in DB Browser for SQLite:
   - File → Open Database → select the `adulting.db` you exported
   - Browse Data → table `emergency_contacts`

Notes:
- If Sharing isn’t available, choose “Save to Files,” then export via iCloud/OneDrive/Email to your PC.

### Option B: iOS Simulator (Mac only)
1) Start the app on iOS Simulator via Expo.
2) On macOS, get the Expo Go container path:
```bash
xcrun simctl get_app_container booted host.exp.Exponent data
```
3) Open the LocalDatabase folder:
```bash
open "$(xcrun simctl get_app_container booted host.exp.Exponent data)/Library/LocalDatabase"
```
4) Copy `adulting.db` to your desktop and open it in DB Browser.

### Inspecting without pulling the file
- In the DevTools console you can quickly view rows:
```javascript
await emergencyDb.debugDumpAll()
```

```powershell
npx expo install expo-file-system expo-sharing
```

```javascript
const FileSystem = require('expo-file-system');
const Sharing = require('expo-sharing');

const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
const dst = FileSystem.documentDirectory + 'adulting.db';

await FileSystem.copyAsync({ from: src, to: dst });
await Sharing.shareAsync(dst);
```

```shellscript
xcrun simctl get_app_container booted host.exp.Exponent data
```

```shellscript
open "$(xcrun simctl get_app_container booted host.exp.Exponent data)/Library/LocalDatabase"
```

```javascript
await emergencyDb.debugDumpAll()
```

---

**User**

I tried to start up my project to test the export you suggested:
But got this error. Debug and resolve these dependancy issues

---

**Cursor**

I’m going to clean the workspace, set npm to use legacy peer dependencies to bypass the styled-components peer conflict, align React/React Native versions to your Expo SDK using Expo’s installer, and then install the required Expo modules. Finally, I’ll run a full install.

I’m going to reinstall dependencies using legacy peer deps to bypass the styled-components/react-dom peer conflict, then install expo-sqlite again.

- Fixed install by cleaning and reinstalling with legacy peer deps, then added `expo-sqlite` pinned for SDK 53.
- You can now run the app and test the iOS export path.

To view the DB from iPhone with DB Browser:
- Install:
  - `npx expo install expo-file-system expo-sharing`
- In Expo DevTools console:
  ```js
  const FileSystem = require('expo-file-system');
  const Sharing = require('expo-sharing');
  const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
  const dst = FileSystem.documentDirectory + 'adulting.db';
  await FileSystem.copyAsync({ from: src, to: dst });
  await Sharing.shareAsync(dst);
  ```
- Share the file to your computer and open it in DB Browser (File → Open → `adulting.db`; Browse Data → `emergency_contacts`).

```javascript
  const FileSystem = require('expo-file-system');
  const Sharing = require('expo-sharing');
  const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
  const dst = FileSystem.documentDirectory + 'adulting.db';
  await FileSystem.copyAsync({ from: src, to: dst });
  await Sharing.shareAsync(dst);
```

---

**User**

I am getting this error:
 DB init error [TypeError: SQLite.openDatabase is not a function (it is undefined)]
Create a new markdown file for keeping record of all the issues we encounter during our local SQLITE DB setup as I want to reference this file to avoid similar issues in the future for other modules.


---

**Cursor**

Updating the SQLite service to use the new async API and adding an issue log markdown with the problem and resolution. Then I'll check for linter errors.

```typescript
import * as SQLite from 'expo-sqlite';

export type EmergencyContact = {
	id: string;
	userId: string;
	title: string;
	phoneNumber: string;
	icon: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDbAsync(): Promise<SQLite.SQLiteDatabase> {
	if (!dbPromise) {
		dbPromise = SQLite.openDatabaseAsync('adulting.db');
	}
	return dbPromise;
}

function generateUuidV4(): string {
	// Lightweight UUID v4 generator without extra deps
	// eslint-disable-next-line no-bitwise
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = (Math.random() * 16) | 0;
		// eslint-disable-next-line no-bitwise
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export async function initializeEmergencyContactsDb(): Promise<void> {
	// Schema per Emergency_Contacts_Module_Database_Schema_MINIMAL.md
	const db = await getDbAsync();
	await db.execAsync(`PRAGMA foreign_keys = ON;`);
	await db.execAsync(
		`CREATE TABLE IF NOT EXISTS emergency_contacts (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			title TEXT NOT NULL,
			phone_number TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT 'local-hospital'
		);`
	);
	await db.execAsync(
		`CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);`
	);
}

export async function insertEmergencyContact(params: {
	userId: string;
	title: string;
	phoneNumber: string;
	icon?: string;
}): Promise<EmergencyContact> {
	const id = generateUuidV4();
	const icon = params.icon ?? 'local-hospital';
	const db = await getDbAsync();
	await db.runAsync(
		`INSERT INTO emergency_contacts (id, user_id, title, phone_number, icon) VALUES (?, ?, ?, ?, ?);`,
		[id, params.userId, params.title, params.phoneNumber, icon]
	);
	return { id, userId: params.userId, title: params.title, phoneNumber: params.phoneNumber, icon };
}

export async function getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
	const db = await getDbAsync();
	const rows = await db.getAllAsync<{
		id: string;
		userId: string;
		title: string;
		phoneNumber: string;
		icon: string;
	}>(
		`SELECT id, user_id as userId, title, phone_number as phoneNumber, icon
		 FROM emergency_contacts
		 WHERE user_id = ?
		 ORDER BY title COLLATE NOCASE ASC;`,
		[userId]
	);
	return rows as unknown as EmergencyContact[];
}

export async function clearEmergencyContactsForUser(userId: string): Promise<number> {
	const db = await getDbAsync();
	const result = await db.runAsync(`DELETE FROM emergency_contacts WHERE user_id = ?;`, [userId]);
	// result.changes contains number of affected rows
	// @ts-ignore
	return (result as any)?.changes ?? 0;
}

export async function countEmergencyContacts(userId: string): Promise<number> {
	const db = await getDbAsync();
	const row = await db.getFirstAsync<{ count: number }>(
		`SELECT COUNT(*) as count FROM emergency_contacts WHERE user_id = ?;`,
		[userId]
	);
	return row?.count ?? 0;
}

export async function debugDumpAll(): Promise<EmergencyContact[]> {
	const db = await getDbAsync();
	const rows = await db.getAllAsync<{
		id: string;
		userId: string;
		title: string;
		phoneNumber: string;
		icon: string;
	}>(
		`SELECT id, user_id as userId, title, phone_number as phoneNumber, icon FROM emergency_contacts ORDER BY user_id, title;`
	);
	return rows as unknown as EmergencyContact[];
}



```

```markdown
# Local SQLite DB Setup Issues Log

Purpose: Track issues and resolutions encountered while integrating local SQLite with Expo for future reuse across modules.

## 2025-08-13 — expo-sqlite API change: openDatabase undefined
- Symptom: `DB init error [TypeError: SQLite.openDatabase is not a function (it is undefined)]`
- Cause: Newer expo-sqlite versions in Expo SDK 53 remove/replace the old imperative API. Use the async API.
- Fix:
  - Replace `SQLite.openDatabase('adulting.db')` with `await SQLite.openDatabaseAsync('adulting.db')`.
  - Use async helpers: `db.execAsync`, `db.runAsync`, `db.getAllAsync`, `db.getFirstAsync`.
  - Updated file: `src/services/emergencyContactsDb.ts`.
  
## 2025-08-13 — NPM peer dependency conflict blocked install
- Symptom: `npm ERR! ERESOLVE could not resolve` with `styled-components` requiring `react-dom` while using React Native.
- Cause: peer dep mismatch in ecosystem; harmless for RN but blocks `npm install`.
- Fix: install with legacy peer deps.
  - Commands:
    - `npm config set legacy-peer-deps true`
    - `npm install --legacy-peer-deps`
  - Then install Expo modules: `npx expo install expo-sqlite`

## 2025-08-13 — iOS Expo Go: where is the DB file?
- Location: `Library/LocalDatabase/adulting.db` inside the app sandbox.
- Export on device (no UI changes): use console with `expo-file-system` + `expo-sharing`.
  ```js
  const FileSystem = require('expo-file-system');
  const Sharing = require('expo-sharing');
  const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
  const dst = FileSystem.documentDirectory + 'adulting.db';
  await FileSystem.copyAsync({ from: src, to: dst });
  await Sharing.shareAsync(dst);
  ```

## 2025-08-13 — Android Expo Go: how to pull DB file
- App id: `host.exp.exponent` (Expo Go). DB lives under app data directory.
- Pull methods:
  - `adb exec-out run-as host.exp.exponent cat /data/data/host.exp.exponent/databases/adulting.db > adulting.db`
  - Or: copy to `/sdcard/Download` then `adb pull`.


```

- Cause: In SDK 53, expo-sqlite moved to the async API. `SQLite.openDatabase` is undefined; use `openDatabaseAsync` and async query methods.
- Fix applied: Updated `src/services/emergencyContactsDb.ts` to use:
  - `await SQLite.openDatabaseAsync('adulting.db')`
  - `db.execAsync`, `db.runAsync`, `db.getAllAsync`, `db.getFirstAsync`
- Issue log added: `adulting-v4/context-files/build-guide/LOCAL_SQLITE_DB_SETUP_ISSUES.md` with this error and the npm peer-deps resolution and iOS/Android DB locations/export steps.

You can retry the app; DB should now initialize correctly.

---

**User**

I did not receive any errors now.
However, I still dont know how to view the SQLite database weve just created as i am using windows, and Expo Go with an iphone for testing.
Where is the database file that i can located and import into DB Browser to view or how else can i view the data in the DB?

---

**Cursor**

### Short answer
- On iPhone with Expo Go, the SQLite file is inside the app sandbox at: Library/LocalDatabase/adulting.db. You can’t browse that directly on iOS, so export it from the app, then open it in DB Browser on Windows.

### Export the DB from iPhone (Expo Go → Windows)
1) Install the required modules (only once):
```bash
npx expo install expo-file-system expo-sharing
```

2) Reload the app in Expo Go.

3) In Expo DevTools Console (press j in the terminal or open the “Console” tab in the browser), run this to verify the DB exists:
```javascript
const FileSystem = require('expo-file-system');
const dbPath = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
await FileSystem.getInfoAsync(dbPath);
```
You should see exists: true.

4) Copy it to a shareable location and open the iOS share sheet:
```javascript
const FileSystem = require('expo-file-system');
const Sharing = require('expo-sharing');

const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
const dst = FileSystem.documentDirectory + 'adulting.db';

await FileSystem.copyAsync({ from: src, to: dst });
await Sharing.shareAsync(dst);
```

5) In the share sheet:
- Save to Files → iCloud Drive or “On My iPhone”, then access it from Windows (iCloud for Windows or iCloud.com).
- Or share to OneDrive/Google Drive and download on Windows.
- Or email it to yourself.

6) Open in DB Browser for SQLite:
- File → Open Database → select the exported `adulting.db`
- Browse Data → select `emergency_contacts`

### Quick check without exporting
- In the console, to view rows:
```javascript
await emergencyDb.debugDumpAll()
```

### Notes
- Path on iOS: Library/LocalDatabase/adulting.db (inside the app sandbox; not directly accessible).
- Data persists across reloads; if you uninstall Expo Go or clear its data, the DB is removed.
- If Sharing isn’t available (rare), use “Save to Files” and then pull via iCloud/OneDrive as above.

```shellscript
npx expo install expo-file-system expo-sharing
```

```javascript
const FileSystem = require('expo-file-system');
const dbPath = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
await FileSystem.getInfoAsync(dbPath);
```

```javascript
const FileSystem = require('expo-file-system');
const Sharing = require('expo-sharing');

const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
const dst = FileSystem.documentDirectory + 'adulting.db';

await FileSystem.copyAsync({ from: src, to: dst });
await Sharing.shareAsync(dst);
```

```javascript
await emergencyDb.debugDumpAll()
```

---

**User**

Im not sure how to access the Dev tools correctly. When i open the debugger to launch Devtools, React Native dev tools opens , but i cant seem to run commands or dont know where to look for this javascript youve provided.

---

**Cursor**

### The right debugger to open
You need the JavaScript debugger console, not React DevTools.

Do one of the following:
- From your Metro terminal: press j
- Or on your iPhone in Expo Go: shake device → tap “Open JavaScript Debugger”

A browser tab will open (Hermes/JS debugger). Use its Console to run code.

### Verify the DB exists (run in the JS debugger Console)
```javascript
const FileSystem = require('expo-file-system');
await FileSystem.getInfoAsync(FileSystem.libraryDirectory + 'LocalDatabase/adulting.db');
```
You should see an object with exists: true.

### Export the DB to your PC (run in the same Console)
```javascript
const FileSystem = require('expo-file-system');
const Sharing = require('expo-sharing');
const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
const dst = FileSystem.documentDirectory + 'adulting.db';
await FileSystem.copyAsync({ from: src, to: dst });
await Sharing.shareAsync(dst);
```
- Choose Save to Files (iCloud/On My iPhone) or share to OneDrive/Google Drive/Email.
- Download the file to Windows and open it in DB Browser (File → Open → adulting.db; Browse Data → emergency_contacts).

### Quick inspect without exporting
Run in the JS debugger Console:
```javascript
await emergencyDb.debugDumpAll()
```

If j opens React DevTools instead:
- Press j again; or close React DevTools and press j.
- Or use the in‑app menu (shake device) → “Open JavaScript Debugger”.

- Use the JS debugger console (not React DevTools). Path on iOS: Library/LocalDatabase/adulting.db.
- Provided exact console snippets to verify and export the DB.

```javascript
const FileSystem = require('expo-file-system');
await FileSystem.getInfoAsync(FileSystem.libraryDirectory + 'LocalDatabase/adulting.db');
```

```javascript
const FileSystem = require('expo-file-system');
const Sharing = require('expo-sharing');
const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
const dst = FileSystem.documentDirectory + 'adulting.db';
await FileSystem.copyAsync({ from: src, to: dst });
await Sharing.shareAsync(dst);
```

```javascript
await emergencyDb.debugDumpAll()
```

---

**User**

When running: const FileSystem = require('expo-file-system');
await FileSystem.getInfoAsync(FileSystem.libraryDirectory + 'LocalDatabase/adulting.db');
in the devtools console i get this:
const FileSystem = require('expo-file-system');
await FileSystem.getInfoAsync(FileSystem.libraryDirectory + 'LocalDatabase/adulting.db');
Compiling JS failed: 1:7:';' expected
What is the issue?

---

**Cursor**

- The console you’re using doesn’t support top‑level await and/or is evaluating each line separately. Use a self‑invoking async function or a then/catch chain.

Try one of these exactly as a single paste:

Option 1 (async IIFE):
```javascript
(async () => {
  const FileSystem = require('expo-file-system');
  const info = await FileSystem.getInfoAsync(FileSystem.libraryDirectory + 'LocalDatabase/adulting.db');
  console.log(info);
})();
```

Option 2 (no await):
```javascript
const FileSystem = require('expo-file-system');
FileSystem.getInfoAsync(FileSystem.libraryDirectory + 'LocalDatabase/adulting.db')
  .then(console.log)
  .catch(console.error);
```

To export the DB (async IIFE):
```javascript
(async () => {
  const FileSystem = require('expo-file-system');
  const Sharing = require('expo-sharing');
  const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
  const dst = FileSystem.documentDirectory + 'adulting.db';
  await FileSystem.copyAsync({ from: src, to: dst });
  await Sharing.shareAsync(dst);
})();
```

If you still see issues, make sure you opened the JavaScript debugger console (press j in Metro or shake device → Open JavaScript Debugger), not React DevTools.

```javascript
(async () => {
  const FileSystem = require('expo-file-system');
  const info = await FileSystem.getInfoAsync(FileSystem.libraryDirectory + 'LocalDatabase/adulting.db');
  console.log(info);
})();
```

```javascript
const FileSystem = require('expo-file-system');
FileSystem.getInfoAsync(FileSystem.libraryDirectory + 'LocalDatabase/adulting.db')
  .then(console.log)
  .catch(console.error);
```

```javascript
(async () => {
  const FileSystem = require('expo-file-system');
  const Sharing = require('expo-sharing');
  const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
  const dst = FileSystem.documentDirectory + 'adulting.db';
  await FileSystem.copyAsync({ from: src, to: dst });
  await Sharing.shareAsync(dst);
})();
```

---

**User**

I get this issue when trying to run the commands you provided:
Compiling JS failed: 1:2:async functions are unsupported


---

**Cursor**

Your console doesn’t allow async/await or async functions. Use Promise-only snippets.

Do this in the JavaScript Debugger console (not React DevTools):
- Open via Metro: press j
- Or on iPhone: shake device → Open JavaScript Debugger

Then paste these exactly:

- Verify DB exists
```javascript
const FS = require('expo-file-system'); FS.getInfoAsync(FS.libraryDirectory + 'LocalDatabase/adulting.db').then(console.log).catch(console.error);
```

- Export DB to share sheet
```javascript
(function(){const FS=require('expo-file-system'); const SH=require('expo-sharing'); const src=FS.libraryDirectory+'LocalDatabase/adulting.db'; const dst=FS.documentDirectory+'adulting.db'; return FS.copyAsync({from:src,to:dst}).then(()=>SH.shareAsync(dst));})().then(()=>console.log('shared')).catch(console.error);
```

- Inspect rows without exporting
```javascript
emergencyDb.debugDumpAll().then(console.log).catch(console.error);
```

Notes:
- Ensure you’re in the JS debugger console. React DevTools’ console won’t run these.
- If the first command shows exists: true, proceed to export and then open the file in DB Browser.

```javascript
const FS = require('expo-file-system'); FS.getInfoAsync(FS.libraryDirectory + 'LocalDatabase/adulting.db').then(console.log).catch(console.error);
```

```javascript
(function(){const FS=require('expo-file-system'); const SH=require('expo-sharing'); const src=FS.libraryDirectory+'LocalDatabase/adulting.db'; const dst=FS.documentDirectory+'adulting.db'; return FS.copyAsync({from:src,to:dst}).then(()=>SH.shareAsync(dst));})().then(()=>console.log('shared')).catch(console.error);
```

```javascript
emergencyDb.debugDumpAll().then(console.log).catch(console.error);
```

---

**User**

I am still getting this error:
Property 'require' doesn't exist
ReferenceError: Property 'require' doesn't exist
    at global (:1:12) ReferenceError: Property 'require' doesn't exist
    at global (:1:12)

Is it really this complicated for me to view the DB?
what do other developers do to view the Local DB using iphone/windows combination?

---

**Cursor**

Installing helper modules to enable a dev-only export function, then wiring a tiny helper you can call as `devDb.exportDb()` from the JS debugger console without using require.

---

**User**

Add a temporary button in the header of @HomeScreen.tsx that exports and shares the Db file.
Do only this. Dont modify any other functionality or UI styling.


---

**Cursor**

I'll add a temporary header button to `src/screens/HomeScreen.tsx` that, when pressed, copies and shares the SQLite DB file using Expo APIs, without altering existing styles or functionality. Then I’ll verify linting.

```typescriptreact
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  Switch,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/styleGuide';
import { motivationalPhrases } from '../constants/motivationalPhrases';
import styled from 'styled-components/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

// Icon type definition
type IconName = 'vacation' | 'dentist' | 'license' | 'documents' | 'travel' | 'reminders' | 'settings' | 'mealprep' | 'emergency' | 'digital_will' | 'vault' | 'pet_tracker' | 'add' | 'home';

// Icon component using Material Icons
const Icon = ({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) => {
  // Map icon names to Material Icons
  const iconMap: Record<IconName, { family: 'MaterialIcons' | 'MaterialCommunityIcons'; icon: string }> = {
    vacation: { family: 'MaterialIcons', icon: 'flight' },
    dentist: { family: 'MaterialIcons', icon: 'medical-services' },
    license: { family: 'MaterialIcons', icon: 'credit-card' },
    documents: { family: 'MaterialIcons', icon: 'description' },
    travel: { family: 'MaterialIcons', icon: 'luggage' },
    reminders: { family: 'MaterialIcons', icon: 'access-alarm' },
    settings: { family: 'MaterialIcons', icon: 'settings' },
    mealprep: { family: 'MaterialIcons', icon: 'restaurant' },
    emergency: { family: 'MaterialIcons', icon: 'emergency' },
    digital_will: { family: 'MaterialIcons', icon: 'gavel' },
    vault: { family: 'MaterialIcons', icon: 'security' },
    pet_tracker: { family: 'MaterialIcons', icon: 'pets' },
    add: { family: 'MaterialIcons', icon: 'add' },
    home: { family: 'MaterialIcons', icon: 'home' },
  };
  
  const iconData = iconMap[name];
  
  if (iconData.family === 'MaterialIcons') {
    return <MaterialIcons name={iconData.icon as any} size={size} color={color} />;
  } else {
    return <MaterialCommunityIcons name={iconData.icon as any} size={size} color={color} />;
  }
};

// Define types for our data
type UpcomingEvent = {
  id: string;
  title: string;
  icon: IconName;
  daysLeft: number;
  dateRange: string;
};

type MenuItem = {
  id: string;
  title: string;
  icon: IconName;
  description: string;
  route: keyof RootStackParamList;
};

// Sample upcoming events data
const upcomingEvents: UpcomingEvent[] = [
  {
    id: '1',
    title: 'Kruger Vacation Trip',
    icon: 'vacation',
    daysLeft: 22,
    dateRange: '12 July - 20 July',
  },
  {
    id: '2',
    title: 'Dentist Appointment',
    icon: 'dentist',
    daysLeft: 3,
    dateRange: '      23 June',
  },
  {
    id: '3',
    title: 'Vehicle License Expiring',
    icon: 'license',
    daysLeft: 34,
    dateRange: '23 June',
  },
];

// Menu items data - All 8 modules
const menuItems: MenuItem[] = [
  {
    id: '1',
    title: 'Mealprep',
    icon: 'mealprep',
    description: 'Recipes and Grocery List',
    route: 'Mealprep',
  },
  {
    id: '2',
    title: 'Documents',
    icon: 'documents',
    description: 'Store and access important files and values',
    route: 'Documents',
  },
  {
    id: '3',
    title: 'Emergency & Safety',
    icon: 'emergency',
    description: 'Emergency Contacts',
    route: 'Emergency',
  },
  {
    id: '4',
    title: 'Digital Will',
    icon: 'digital_will',
    description: 'Manage your digital legacy',
    route: 'DigitalWill',
  },
  {
    id: '5',
    title: 'Smart Reminders',
    icon: 'reminders',
    description: 'Set Reminders for important dates and tasks',
    route: 'SmartReminders',
  },
  {
    id: '6',
    title: 'Travel Assistant',
    icon: 'travel',
    description: 'Organize trips, itineraries, tickets and packing lists',
    route: 'TravelAssistant',
  },
  {
    id: '7',
    title: 'Vault',
    icon: 'vault',
    description: 'Secure storage for sensitive information',
    route: 'Vault',
  },
  {
    id: '8',
    title: 'Pet Tracker',
    icon: 'pet_tracker',
    description: 'Track your pets health and activities',
    route: 'PetTracker',
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Haptics helpers (optional at runtime)
const triggerSelectionHaptic = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const H = require('expo-haptics');
    if (H?.selectionAsync) {
      await H.selectionAsync();
    }
  } catch {}
};

const triggerLightImpactHaptic = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const H = require('expo-haptics');
    if (H?.impactAsync && H?.ImpactFeedbackStyle?.Light) {
      await H.impactAsync(H.ImpactFeedbackStyle.Light);
    }
  } catch {}
};

const triggerModuleCardHaptic = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const H = require('expo-haptics');
    // Example 1: Double heavy impact (stronger than single heavy)
    if (H?.impactAsync && H?.ImpactFeedbackStyle?.Heavy) {
      await Promise.all([
        H.impactAsync(H.ImpactFeedbackStyle.Heavy),
        H.impactAsync(H.ImpactFeedbackStyle.Heavy)
      ]);
    }
    
    // Example 2: Heavy impact + Success notification (very strong)
    // if (H?.impactAsync && H?.notificationAsync) {
    //   await Promise.all([
    //     H.impactAsync(H.ImpactFeedbackStyle.Heavy),
    //     H.notificationAsync(H.NotificationFeedbackType.Success)
    //   ]);
    // }
    
    // Example 3: Triple pattern (tap-tap-strong)
    // if (H?.impactAsync) {
    //   await H.impactAsync(H.ImpactFeedbackStyle.Light);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Light);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Heavy);
    // }
    
    // Example 4: Escalating pattern (light to heavy)
    // if (H?.impactAsync) {
    //   await H.impactAsync(H.ImpactFeedbackStyle.Light);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Medium);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Heavy);
    // }
    
    // Fallback to selection if haptics not available
    else if (H?.selectionAsync) {
      await H.selectionAsync();
    }
  } catch {}
};

// Quick Create Menu (inline to HomeScreen only)
const QuickCreateMenu = ({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (route: keyof RootStackParamList) => void;
}) => {
  const [shouldRender, setShouldRender] = React.useState(visible);
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const translateYAnim = React.useRef(new Animated.Value(12)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const backdropAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else if (shouldRender) {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 160, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 12, duration: 160, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start(() => setShouldRender(false));
    }
  }, [visible]);

  if (!shouldRender) return null;

  // Anchor the menu to the add button (approximate) so it looks like it grows from it
  const screenWidth = Dimensions.get('window').width;
  const menuWidth = Math.min(screenWidth - 32, 320);
  const bottomBarWidth = 185; // matches styles.bottomActionsContainer.width
  const centeredLeft = (screenWidth - menuWidth) / 2; // center horizontally
  const bottomOffset = spacing.xl + 70; // bottom actions bottom + actionButton height + margin

  const quickActions: Array<{ id: string; label: string; icon: IconName; route: keyof RootStackParamList }> = [
    { id: 'qa_docs', label: 'New Document', icon: 'documents', route: 'Documents' },
    { id: 'qa_vault', label: 'Vault Item', icon: 'vault', route: 'Vault' },
    { id: 'qa_dw', label: 'Digital Will Item', icon: 'digital_will', route: 'DigitalWill' },
    { id: 'qa_emerg', label: 'Emergency Contact', icon: 'emergency', route: 'Emergency' },
    { id: 'qa_recipe', label: 'New Recipe', icon: 'mealprep', route: 'Mealprep' },
    { id: 'qa_remind', label: 'Smart Reminder', icon: 'reminders', route: 'SmartReminders' },
  ];

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.quickMenuBackdrop, { opacity: backdropAnim }]}
      />
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.quickMenuContainer,
          {
            left: centeredLeft,
            bottom: bottomOffset,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <Text style={styles.quickMenuTitle}>QUICK CREATE</Text>
        <View style={styles.quickMenuGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.9}
              style={styles.quickMenuItem}
              onPress={() => {
                onSelect(action.route);
                onClose();
              }}
            >
              <View style={styles.quickMenuItemContent}>
                <View style={styles.quickMenuItemIcon}>
                  <Icon name={action.icon} color={colors.text.secondary} size={26} />
                </View>
                <Text style={styles.quickMenuItemLabel} numberOfLines={2} ellipsizeMode="tail">
                  {action.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

// Animated Tagline Component
const AnimatedTagline = () => {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const [currentPhrase, setCurrentPhrase] = React.useState(motivationalPhrases[0]);
  const phraseIndexRef = React.useRef(0);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  const animateNextPhrase = React.useCallback(() => {
    // Start fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      // Update phrase while invisible
      phraseIndexRef.current = (phraseIndexRef.current + 1) % motivationalPhrases.length;
      setCurrentPhrase(motivationalPhrases[phraseIndexRef.current]);
      
      // Start fade in
      Animated.timing(fadeAnim, {
        toValue: 6,
        duration: 3000,
        useNativeDriver: true,
      }).start();
      
      // Schedule next animation
      timeoutRef.current = setTimeout(animateNextPhrase, 4000);
    });
  }, [fadeAnim]);

  React.useEffect(() => {
    // Start first animation after initial delay
    timeoutRef.current = setTimeout(animateNextPhrase, 4000);
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      fadeAnim.stopAnimation();
    };
  }, [animateNextPhrase]);

  return (
    <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
      {currentPhrase}
    </Animated.Text>
  );
};

const HomeScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const { user, signOut } = useAuth();
  const [isGridView, setIsGridView] = React.useState(true);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  
  // Create animated values for each section
  const headerFade = React.useRef(new Animated.Value(0)).current;
  const upcomingFade = React.useRef(new Animated.Value(0)).current;
  const menuFade = React.useRef(new Animated.Value(0)).current;
  const actionsFade = React.useRef(new Animated.Value(0)).current;
  const [isQuickMenuOpen, setIsQuickMenuOpen] = React.useState(false);

  React.useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Fade in header
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Fade in upcoming section
      Animated.timing(upcomingFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Fade in menu section
      Animated.timing(menuFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Fade in bottom actions
      Animated.timing(actionsFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      console.log('Signed out successfully');
    }
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  const navigateToEventDetails = (eventId: string) => {
    console.log(`Navigate to event details: ${eventId}`);
  };

  const openModuleHome = async (route: keyof RootStackParamList) => {
    await triggerSelectionHaptic();
    navigation.navigate(route);
  };

  const openModuleCreate = async (route: keyof RootStackParamList) => {
    await triggerSelectionHaptic();
    switch (route) {
      case 'Documents':
        (navigation as any).navigate('Documents', { screen: 'AddDocument' });
        return;
      case 'Vault':
        (navigation as any).navigate('Vault', { screen: 'AddVaultItem' });
        return;
      case 'DigitalWill':
        (navigation as any).navigate('DigitalWill', { screen: 'AddDigitalWillItem' });
        return;
      case 'Emergency':
        (navigation as any).navigate('Emergency', { screen: 'AddEmergencyContact' });
        return;
      case 'Mealprep':
        (navigation as any).navigate('Mealprep', { screen: 'AddRecipe' });
        return;
      case 'SmartReminders':
        (navigation as any).navigate('SmartReminders', { screen: 'AddSmartReminder' });
        return;
      default:
        navigation.navigate(route);
        return;
    }
  };

  const toggleViewMode = (newValue: boolean) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Change view mode
      setIsGridView(newValue);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };
  
  const handleAddButtonPress = async () => {
    if (!isQuickMenuOpen) {
      await triggerLightImpactHaptic();
    } else {
      await triggerSelectionHaptic();
    }
    setIsQuickMenuOpen((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <Animated.View style={{ opacity: headerFade }}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <Image 
              source={require('../../src/assets/adulting-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            {/* TEMP: Export DB button (iOS share) */}
            <TouchableOpacity
              onPress={async () => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const FileSystem = require('expo-file-system');
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const Sharing = require('expo-sharing');
                  const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
                  const dst = FileSystem.documentDirectory + 'adulting.db';
                  await FileSystem.copyAsync({ from: src, to: dst });
                  if (Sharing && (await Sharing.isAvailableAsync?.())) {
                    await Sharing.shareAsync(dst);
                  }
                } catch (e) {
                  console.error('DB export failed', e);
                }
              }}
              activeOpacity={0.8}
              style={styles.headerExportButton}
            >
              <MaterialIcons name="ios-share" size={22} color="#ffffff" />
            </TouchableOpacity>
            <AnimatedTagline />
          </View>
        </SafeAreaView>
      </Animated.View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Events Section */}
                <Animated.View style={[styles.section, { opacity: upcomingFade }]}>
          <View style={styles.upcomingHeader}>
            <View style={styles.sectionTitleCard}>
              <Text style={styles.sectionTitleMain}>NEXT UP</Text>
            </View>
            
            <View style={[styles.upcomingCard, { marginTop: 5 }]}>
            {upcomingEvents.map((event, index) => (
              <View key={event.id}>
                <TouchableOpacity
                  style={styles.eventItem}
                  onPress={() => navigateToEventDetails(event.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.eventContent}>
                    <View style={styles.eventIconContainer}>
                      <Icon name={event.icon} color="white" size={28} />
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDate}>
                        In {event.daysLeft} days{ '\t' }{event.dateRange}
                      </Text>
                    </View>
                    <LinearGradient
                      colors={['#028de5', '#d85ff2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1.2, y: 1.3 }}
                      style={styles.chevronContainer}
                    >
                      <MaterialIcons name="chevron-right" size={32} color="white" />
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                {index < upcomingEvents.length - 1 && <View style={styles.eventSeparator} />}
              </View>
            ))}
            </View>
          </View>
        </Animated.View>
        
        {/* Menu Section */}
        <Animated.View style={[styles.section, { opacity: menuFade }]}>
          <View style={styles.menuHeader}>
            <Text style={styles.sectionTitle}>MENU</Text>
                        <View style={styles.viewToggleContainer}>
              <View style={styles.switchContainer}>
                <Switch
                  value={isGridView}
                  onValueChange={toggleViewMode}
                  trackColor={{ false: '#e0e0e0', true: '#e0e0e0' }}
                  thumbColor="#333333"
                  ios_backgroundColor="#e0e0e0"
                  style={{ transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }] }}
                />
                <View style={styles.switchIconsContainer}>
                  <MaterialIcons 
                    name="view-list" 
                    size={20} 
                    color={!isGridView ? "#e6e6e6" : "#999"} 
                    style={styles.switchIconLeft}
                  />
                  <MaterialIcons 
                    name="grid-view" 
                    size={20} 
                    color={isGridView ? "#e6e6e6" : "#636363"}
                    style={styles.switchIconRight}
                  />
                </View>
              </View>
            </View>
          </View>
          
          <Animated.View style={{ opacity: fadeAnim }}>
            {isGridView ? (
              <View style={styles.menuGridContainer}>
                {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuGridCard}
                  onPress={() => openModuleHome(item.route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuGridContent}>
                    <View style={styles.menuGridIconContainer}>
                      <Icon name={item.icon} color={colors.text.secondary} size={28} />
                    </View>
                    <Text style={styles.menuGridTitle}>{item.title}</Text>
                                         <Text style={styles.menuGridDescription}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              </View>
            ) : (
              <View style={styles.menuContainer}>
                {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuCard}
                  onPress={() => openModuleHome(item.route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuContent}>
                    <View style={styles.menuIconContainer}>
                      <Icon name={item.icon} color={colors.text.secondary} size={28} />
                    </View>
                    <View style={styles.menuDetails}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
      
      {/* Bottom Action Buttons */}
      <Animated.View style={{ opacity: actionsFade }}>
        <LinearGradient
        colors={['#028de5', '#d85ff2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.2, y: 1.9 }}
        style={styles.bottomActionsContainer}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAddButtonPress}
          activeOpacity={0.8}
        >
          <Icon name="add" color="white" size={32} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToSettings}
          activeOpacity={0.8}
        >
          <Icon name="settings" color="white" size={28} />
        </TouchableOpacity>
      </LinearGradient>
      </Animated.View>

      {/* Quick Create Menu Overlay (render last to sit on top) */}
      <QuickCreateMenu
        visible={isQuickMenuOpen}
        onClose={() => setIsQuickMenuOpen(false)}
        onSelect={(route) => openModuleCreate(route)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  headerSafeArea: {
    backgroundColor: colors.background.dark,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 5,
    height: 85,
  },
  logo: {
    width: 250,
    height: 45,
  },
  tagline: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.light,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 150, // Increased extra space at the bottom to ensure content goes beyond SafeAreaView
  },
  section: {
    marginBottom: spacing.xl,
  },
  upcomingHeader: {
    paddingTop: (typography.fontSize.xxl + spacing.xs * 2 ) / 2,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  sectionTitleCard: {
    backgroundColor: colors.background.light,
    borderWidth: 0, //next up text card
    borderColor: colors.thirdly,
    borderRadius: 25,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignSelf: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  sectionTitleMain: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text.thirdly,
    alignSelf: 'center',
  },
  upcomingCard: {
    backgroundColor: '#333333',
    borderRadius: 35,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  eventItem: {
    // No individual background or border radius
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  eventIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    opacity: 0.8,
  },
  eventSeparator: {
    height: 1,
    backgroundColor: colors.text.white,
    opacity: 0.2,
    marginLeft: spacing.lg,
    marginRight: spacing.lg,
  },
  chevronContainer: {
    width: 65, // Increased by 15px from 50px
    height: 50,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: typography.fontSize.xl , // Match the height of section title text plus padding
  },
  switchContainer: {
    position: 'relative',
    justifyContent: 'flex-start',
    marginRight: spacing.m,
  },
  switchIconsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    pointerEvents: 'none',
  },
  switchIconLeft: {
    marginLeft: -2,
  },
  switchIconRight: {
    marginRight: -2,
  },
  menuContainer: {
    gap: 5, // Reduced spacing between menu items to 5px
  },
  menuCard: {
    backgroundColor: '#f5f5f5', // Very light grey background (same as grid)
    borderRadius: 35, // Increased corner radius
    padding: spacing.md, // Reduced padding inside the card
    marginBottom: 5, // Reduced margin between cards to 5px
    minHeight: 80, // Ensure enough height to display content
    borderWidth: 2,
    borderColor: '#333333', // Dark grey border (same as Upcoming card)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuGridCard: {
    width: '48%',
    backgroundColor: '#f5f5f5', // Very light grey background
    borderRadius: 35,
    padding: spacing.md,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#333333', // Dark grey border (same as Upcoming card)
    minHeight: 140, // Ensure enough height to display content
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center', // Center items vertically
    paddingVertical: 4, // Add minimal vertical padding
  },
  menuIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm, // Reduced right margin
  },
  menuDetails: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl, // Increased text size
    color: '#333333', // Dark grey text (same as grid)
    marginBottom: 2, // Reduced space between title and description
  },
  menuDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md, // Increased text size
    color: '#333333', // Dark grey text (same as grid)
    opacity: 0.9,
    lineHeight: typography.fontSize.md * 1.2, // Reduced line height for tighter text
  },
  menuGridContent: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  menuGridIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  menuGridTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: '#333333', // Dark grey text (same as border)
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  menuGridDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#333333', // Dark grey text (same as border)
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.2,
  },
  bottomActionsContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 50,
    paddingVertical: 3,
    paddingHorizontal: 3,
    width: 185, // Fixed width for the container
    height: 60,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  actionButton: {
    width: 80,
    height: 50,
    borderRadius: 40,
    backgroundColor: '#000000', // Black background for buttons
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  // Quick Create Menu styles
  quickMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  quickMenuContainer: {
    position: 'absolute',
    width: Math.min(Dimensions.get('window').width - 32, 320),
    backgroundColor: '#f5f5f5',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#333333',
    padding: spacing.m * 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  quickMenuTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm * 1.3,
    color: '#333333',
    marginBottom: spacing.sm * 1.2,
  },
  quickMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickMenuItem: {
    width: '48%',
    height: 72,
    backgroundColor: '#ffffff',
    borderRadius: 36,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: '#333333',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickMenuItemIcon: {
    width: 26,
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  quickMenuItemLabel: {
    flexShrink: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md * 1.1,
    color: '#333333',
  },
});

export default HomeScreen;
```

```typescriptreact
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  Switch,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/styleGuide';
import { motivationalPhrases } from '../constants/motivationalPhrases';
import styled from 'styled-components/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

// Icon type definition
type IconName = 'vacation' | 'dentist' | 'license' | 'documents' | 'travel' | 'reminders' | 'settings' | 'mealprep' | 'emergency' | 'digital_will' | 'vault' | 'pet_tracker' | 'add' | 'home';

// Icon component using Material Icons
const Icon = ({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) => {
  // Map icon names to Material Icons
  const iconMap: Record<IconName, { family: 'MaterialIcons' | 'MaterialCommunityIcons'; icon: string }> = {
    vacation: { family: 'MaterialIcons', icon: 'flight' },
    dentist: { family: 'MaterialIcons', icon: 'medical-services' },
    license: { family: 'MaterialIcons', icon: 'credit-card' },
    documents: { family: 'MaterialIcons', icon: 'description' },
    travel: { family: 'MaterialIcons', icon: 'luggage' },
    reminders: { family: 'MaterialIcons', icon: 'access-alarm' },
    settings: { family: 'MaterialIcons', icon: 'settings' },
    mealprep: { family: 'MaterialIcons', icon: 'restaurant' },
    emergency: { family: 'MaterialIcons', icon: 'emergency' },
    digital_will: { family: 'MaterialIcons', icon: 'gavel' },
    vault: { family: 'MaterialIcons', icon: 'security' },
    pet_tracker: { family: 'MaterialIcons', icon: 'pets' },
    add: { family: 'MaterialIcons', icon: 'add' },
    home: { family: 'MaterialIcons', icon: 'home' },
  };
  
  const iconData = iconMap[name];
  
  if (iconData.family === 'MaterialIcons') {
    return <MaterialIcons name={iconData.icon as any} size={size} color={color} />;
  } else {
    return <MaterialCommunityIcons name={iconData.icon as any} size={size} color={color} />;
  }
};

// Define types for our data
type UpcomingEvent = {
  id: string;
  title: string;
  icon: IconName;
  daysLeft: number;
  dateRange: string;
};

type MenuItem = {
  id: string;
  title: string;
  icon: IconName;
  description: string;
  route: keyof RootStackParamList;
};

// Sample upcoming events data
const upcomingEvents: UpcomingEvent[] = [
  {
    id: '1',
    title: 'Kruger Vacation Trip',
    icon: 'vacation',
    daysLeft: 22,
    dateRange: '12 July - 20 July',
  },
  {
    id: '2',
    title: 'Dentist Appointment',
    icon: 'dentist',
    daysLeft: 3,
    dateRange: '      23 June',
  },
  {
    id: '3',
    title: 'Vehicle License Expiring',
    icon: 'license',
    daysLeft: 34,
    dateRange: '23 June',
  },
];

// Menu items data - All 8 modules
const menuItems: MenuItem[] = [
  {
    id: '1',
    title: 'Mealprep',
    icon: 'mealprep',
    description: 'Recipes and Grocery List',
    route: 'Mealprep',
  },
  {
    id: '2',
    title: 'Documents',
    icon: 'documents',
    description: 'Store and access important files and values',
    route: 'Documents',
  },
  {
    id: '3',
    title: 'Emergency & Safety',
    icon: 'emergency',
    description: 'Emergency Contacts',
    route: 'Emergency',
  },
  {
    id: '4',
    title: 'Digital Will',
    icon: 'digital_will',
    description: 'Manage your digital legacy',
    route: 'DigitalWill',
  },
  {
    id: '5',
    title: 'Smart Reminders',
    icon: 'reminders',
    description: 'Set Reminders for important dates and tasks',
    route: 'SmartReminders',
  },
  {
    id: '6',
    title: 'Travel Assistant',
    icon: 'travel',
    description: 'Organize trips, itineraries, tickets and packing lists',
    route: 'TravelAssistant',
  },
  {
    id: '7',
    title: 'Vault',
    icon: 'vault',
    description: 'Secure storage for sensitive information',
    route: 'Vault',
  },
  {
    id: '8',
    title: 'Pet Tracker',
    icon: 'pet_tracker',
    description: 'Track your pets health and activities',
    route: 'PetTracker',
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Haptics helpers (optional at runtime)
const triggerSelectionHaptic = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const H = require('expo-haptics');
    if (H?.selectionAsync) {
      await H.selectionAsync();
    }
  } catch {}
};

const triggerLightImpactHaptic = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const H = require('expo-haptics');
    if (H?.impactAsync && H?.ImpactFeedbackStyle?.Light) {
      await H.impactAsync(H.ImpactFeedbackStyle.Light);
    }
  } catch {}
};

const triggerModuleCardHaptic = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const H = require('expo-haptics');
    // Example 1: Double heavy impact (stronger than single heavy)
    if (H?.impactAsync && H?.ImpactFeedbackStyle?.Heavy) {
      await Promise.all([
        H.impactAsync(H.ImpactFeedbackStyle.Heavy),
        H.impactAsync(H.ImpactFeedbackStyle.Heavy)
      ]);
    }
    
    // Example 2: Heavy impact + Success notification (very strong)
    // if (H?.impactAsync && H?.notificationAsync) {
    //   await Promise.all([
    //     H.impactAsync(H.ImpactFeedbackStyle.Heavy),
    //     H.notificationAsync(H.NotificationFeedbackType.Success)
    //   ]);
    // }
    
    // Example 3: Triple pattern (tap-tap-strong)
    // if (H?.impactAsync) {
    //   await H.impactAsync(H.ImpactFeedbackStyle.Light);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Light);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Heavy);
    // }
    
    // Example 4: Escalating pattern (light to heavy)
    // if (H?.impactAsync) {
    //   await H.impactAsync(H.ImpactFeedbackStyle.Light);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Medium);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Heavy);
    // }
    
    // Fallback to selection if haptics not available
    else if (H?.selectionAsync) {
      await H.selectionAsync();
    }
  } catch {}
};

// Quick Create Menu (inline to HomeScreen only)
const QuickCreateMenu = ({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (route: keyof RootStackParamList) => void;
}) => {
  const [shouldRender, setShouldRender] = React.useState(visible);
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const translateYAnim = React.useRef(new Animated.Value(12)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const backdropAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else if (shouldRender) {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 160, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 12, duration: 160, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start(() => setShouldRender(false));
    }
  }, [visible]);

  if (!shouldRender) return null;

  // Anchor the menu to the add button (approximate) so it looks like it grows from it
  const screenWidth = Dimensions.get('window').width;
  const menuWidth = Math.min(screenWidth - 32, 320);
  const bottomBarWidth = 185; // matches styles.bottomActionsContainer.width
  const centeredLeft = (screenWidth - menuWidth) / 2; // center horizontally
  const bottomOffset = spacing.xl + 70; // bottom actions bottom + actionButton height + margin

  const quickActions: Array<{ id: string; label: string; icon: IconName; route: keyof RootStackParamList }> = [
    { id: 'qa_docs', label: 'New Document', icon: 'documents', route: 'Documents' },
    { id: 'qa_vault', label: 'Vault Item', icon: 'vault', route: 'Vault' },
    { id: 'qa_dw', label: 'Digital Will Item', icon: 'digital_will', route: 'DigitalWill' },
    { id: 'qa_emerg', label: 'Emergency Contact', icon: 'emergency', route: 'Emergency' },
    { id: 'qa_recipe', label: 'New Recipe', icon: 'mealprep', route: 'Mealprep' },
    { id: 'qa_remind', label: 'Smart Reminder', icon: 'reminders', route: 'SmartReminders' },
  ];

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.quickMenuBackdrop, { opacity: backdropAnim }]}
      />
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.quickMenuContainer,
          {
            left: centeredLeft,
            bottom: bottomOffset,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <Text style={styles.quickMenuTitle}>QUICK CREATE</Text>
        <View style={styles.quickMenuGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.9}
              style={styles.quickMenuItem}
              onPress={() => {
                onSelect(action.route);
                onClose();
              }}
            >
              <View style={styles.quickMenuItemContent}>
                <View style={styles.quickMenuItemIcon}>
                  <Icon name={action.icon} color={colors.text.secondary} size={26} />
                </View>
                <Text style={styles.quickMenuItemLabel} numberOfLines={2} ellipsizeMode="tail">
                  {action.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

// Animated Tagline Component
const AnimatedTagline = () => {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const [currentPhrase, setCurrentPhrase] = React.useState(motivationalPhrases[0]);
  const phraseIndexRef = React.useRef(0);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  const animateNextPhrase = React.useCallback(() => {
    // Start fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      // Update phrase while invisible
      phraseIndexRef.current = (phraseIndexRef.current + 1) % motivationalPhrases.length;
      setCurrentPhrase(motivationalPhrases[phraseIndexRef.current]);
      
      // Start fade in
      Animated.timing(fadeAnim, {
        toValue: 6,
        duration: 3000,
        useNativeDriver: true,
      }).start();
      
      // Schedule next animation
      timeoutRef.current = setTimeout(animateNextPhrase, 4000);
    });
  }, [fadeAnim]);

  React.useEffect(() => {
    // Start first animation after initial delay
    timeoutRef.current = setTimeout(animateNextPhrase, 4000);
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      fadeAnim.stopAnimation();
    };
  }, [animateNextPhrase]);

  return (
    <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
      {currentPhrase}
    </Animated.Text>
  );
};

const HomeScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const { user, signOut } = useAuth();
  const [isGridView, setIsGridView] = React.useState(true);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  
  // Create animated values for each section
  const headerFade = React.useRef(new Animated.Value(0)).current;
  const upcomingFade = React.useRef(new Animated.Value(0)).current;
  const menuFade = React.useRef(new Animated.Value(0)).current;
  const actionsFade = React.useRef(new Animated.Value(0)).current;
  const [isQuickMenuOpen, setIsQuickMenuOpen] = React.useState(false);

  React.useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Fade in header
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Fade in upcoming section
      Animated.timing(upcomingFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Fade in menu section
      Animated.timing(menuFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Fade in bottom actions
      Animated.timing(actionsFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      console.log('Signed out successfully');
    }
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  const navigateToEventDetails = (eventId: string) => {
    console.log(`Navigate to event details: ${eventId}`);
  };

  const openModuleHome = async (route: keyof RootStackParamList) => {
    await triggerSelectionHaptic();
    navigation.navigate(route);
  };

  const openModuleCreate = async (route: keyof RootStackParamList) => {
    await triggerSelectionHaptic();
    switch (route) {
      case 'Documents':
        (navigation as any).navigate('Documents', { screen: 'AddDocument' });
        return;
      case 'Vault':
        (navigation as any).navigate('Vault', { screen: 'AddVaultItem' });
        return;
      case 'DigitalWill':
        (navigation as any).navigate('DigitalWill', { screen: 'AddDigitalWillItem' });
        return;
      case 'Emergency':
        (navigation as any).navigate('Emergency', { screen: 'AddEmergencyContact' });
        return;
      case 'Mealprep':
        (navigation as any).navigate('Mealprep', { screen: 'AddRecipe' });
        return;
      case 'SmartReminders':
        (navigation as any).navigate('SmartReminders', { screen: 'AddSmartReminder' });
        return;
      default:
        navigation.navigate(route);
        return;
    }
  };

  const toggleViewMode = (newValue: boolean) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Change view mode
      setIsGridView(newValue);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };
  
  const handleAddButtonPress = async () => {
    if (!isQuickMenuOpen) {
      await triggerLightImpactHaptic();
    } else {
      await triggerSelectionHaptic();
    }
    setIsQuickMenuOpen((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <Animated.View style={{ opacity: headerFade }}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <Image 
              source={require('../../src/assets/adulting-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            {/* TEMP: Export DB button (iOS share) */}
            <TouchableOpacity
              onPress={async () => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const FileSystem = require('expo-file-system');
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const Sharing = require('expo-sharing');
                  const src = FileSystem.libraryDirectory + 'LocalDatabase/adulting.db';
                  const dst = FileSystem.documentDirectory + 'adulting.db';
                  await FileSystem.copyAsync({ from: src, to: dst });
                  if (Sharing && (await Sharing.isAvailableAsync?.())) {
                    await Sharing.shareAsync(dst);
                  }
                } catch (e) {
                  console.error('DB export failed', e);
                }
              }}
              activeOpacity={0.8}
              style={styles.headerExportButton}
            >
              <MaterialIcons name="ios-share" size={22} color="#ffffff" />
            </TouchableOpacity>
            <AnimatedTagline />
          </View>
        </SafeAreaView>
      </Animated.View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Events Section */}
                <Animated.View style={[styles.section, { opacity: upcomingFade }]}>
          <View style={styles.upcomingHeader}>
            <View style={styles.sectionTitleCard}>
              <Text style={styles.sectionTitleMain}>NEXT UP</Text>
            </View>
            
            <View style={[styles.upcomingCard, { marginTop: 5 }]}>
            {upcomingEvents.map((event, index) => (
              <View key={event.id}>
                <TouchableOpacity
                  style={styles.eventItem}
                  onPress={() => navigateToEventDetails(event.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.eventContent}>
                    <View style={styles.eventIconContainer}>
                      <Icon name={event.icon} color="white" size={28} />
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDate}>
                        In {event.daysLeft} days{ '\t' }{event.dateRange}
                      </Text>
                    </View>
                    <LinearGradient
                      colors={['#028de5', '#d85ff2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1.2, y: 1.3 }}
                      style={styles.chevronContainer}
                    >
                      <MaterialIcons name="chevron-right" size={32} color="white" />
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                {index < upcomingEvents.length - 1 && <View style={styles.eventSeparator} />}
              </View>
            ))}
            </View>
          </View>
        </Animated.View>
        
        {/* Menu Section */}
        <Animated.View style={[styles.section, { opacity: menuFade }]}>
          <View style={styles.menuHeader}>
            <Text style={styles.sectionTitle}>MENU</Text>
                        <View style={styles.viewToggleContainer}>
              <View style={styles.switchContainer}>
                <Switch
                  value={isGridView}
                  onValueChange={toggleViewMode}
                  trackColor={{ false: '#e0e0e0', true: '#e0e0e0' }}
                  thumbColor="#333333"
                  ios_backgroundColor="#e0e0e0"
                  style={{ transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }] }}
                />
                <View style={styles.switchIconsContainer}>
                  <MaterialIcons 
                    name="view-list" 
                    size={20} 
                    color={!isGridView ? "#e6e6e6" : "#999"} 
                    style={styles.switchIconLeft}
                  />
                  <MaterialIcons 
                    name="grid-view" 
                    size={20} 
                    color={isGridView ? "#e6e6e6" : "#636363"}
                    style={styles.switchIconRight}
                  />
                </View>
              </View>
            </View>
          </View>
          
          <Animated.View style={{ opacity: fadeAnim }}>
            {isGridView ? (
              <View style={styles.menuGridContainer}>
                {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuGridCard}
                  onPress={() => openModuleHome(item.route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuGridContent}>
                    <View style={styles.menuGridIconContainer}>
                      <Icon name={item.icon} color={colors.text.secondary} size={28} />
                    </View>
                    <Text style={styles.menuGridTitle}>{item.title}</Text>
                                         <Text style={styles.menuGridDescription}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              </View>
            ) : (
              <View style={styles.menuContainer}>
                {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuCard}
                  onPress={() => openModuleHome(item.route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuContent}>
                    <View style={styles.menuIconContainer}>
                      <Icon name={item.icon} color={colors.text.secondary} size={28} />
                    </View>
                    <View style={styles.menuDetails}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
      
      {/* Bottom Action Buttons */}
      <Animated.View style={{ opacity: actionsFade }}>
        <LinearGradient
        colors={['#028de5', '#d85ff2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.2, y: 1.9 }}
        style={styles.bottomActionsContainer}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAddButtonPress}
          activeOpacity={0.8}
        >
          <Icon name="add" color="white" size={32} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToSettings}
          activeOpacity={0.8}
        >
          <Icon name="settings" color="white" size={28} />
        </TouchableOpacity>
      </LinearGradient>
      </Animated.View>

      {/* Quick Create Menu Overlay (render last to sit on top) */}
      <QuickCreateMenu
        visible={isQuickMenuOpen}
        onClose={() => setIsQuickMenuOpen(false)}
        onSelect={(route) => openModuleCreate(route)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  headerSafeArea: {
    backgroundColor: colors.background.dark,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 5,
    height: 85,
  },
  logo: {
    width: 250,
    height: 45,
  },
  headerExportButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.light,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 150, // Increased extra space at the bottom to ensure content goes beyond SafeAreaView
  },
  section: {
    marginBottom: spacing.xl,
  },
  upcomingHeader: {
    paddingTop: (typography.fontSize.xxl + spacing.xs * 2 ) / 2,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  sectionTitleCard: {
    backgroundColor: colors.background.light,
    borderWidth: 0, //next up text card
    borderColor: colors.thirdly,
    borderRadius: 25,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignSelf: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  sectionTitleMain: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text.thirdly,
    alignSelf: 'center',
  },
  upcomingCard: {
    backgroundColor: '#333333',
    borderRadius: 35,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  eventItem: {
    // No individual background or border radius
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  eventIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    opacity: 0.8,
  },
  eventSeparator: {
    height: 1,
    backgroundColor: colors.text.white,
    opacity: 0.2,
    marginLeft: spacing.lg,
    marginRight: spacing.lg,
  },
  chevronContainer: {
    width: 65, // Increased by 15px from 50px
    height: 50,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: typography.fontSize.xl , // Match the height of section title text plus padding
  },
  switchContainer: {
    position: 'relative',
    justifyContent: 'flex-start',
    marginRight: spacing.m,
  },
  switchIconsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    pointerEvents: 'none',
  },
  switchIconLeft: {
    marginLeft: -2,
  },
  switchIconRight: {
    marginRight: -2,
  },
  menuContainer: {
    gap: 5, // Reduced spacing between menu items to 5px
  },
  menuCard: {
    backgroundColor: '#f5f5f5', // Very light grey background (same as grid)
    borderRadius: 35, // Increased corner radius
    padding: spacing.md, // Reduced padding inside the card
    marginBottom: 5, // Reduced margin between cards to 5px
    minHeight: 80, // Ensure enough height to display content
    borderWidth: 2,
    borderColor: '#333333', // Dark grey border (same as Upcoming card)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuGridCard: {
    width: '48%',
    backgroundColor: '#f5f5f5', // Very light grey background
    borderRadius: 35,
    padding: spacing.md,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#333333', // Dark grey border (same as Upcoming card)
    minHeight: 140, // Ensure enough height to display content
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center', // Center items vertically
    paddingVertical: 4, // Add minimal vertical padding
  },
  menuIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm, // Reduced right margin
  },
  menuDetails: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl, // Increased text size
    color: '#333333', // Dark grey text (same as grid)
    marginBottom: 2, // Reduced space between title and description
  },
  menuDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md, // Increased text size
    color: '#333333', // Dark grey text (same as grid)
    opacity: 0.9,
    lineHeight: typography.fontSize.md * 1.2, // Reduced line height for tighter text
  },
  menuGridContent: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  menuGridIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  menuGridTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: '#333333', // Dark grey text (same as border)
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  menuGridDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#333333', // Dark grey text (same as border)
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.2,
  },
  bottomActionsContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 50,
    paddingVertical: 3,
    paddingHorizontal: 3,
    width: 185, // Fixed width for the container
    height: 60,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  actionButton: {
    width: 80,
    height: 50,
    borderRadius: 40,
    backgroundColor: '#000000', // Black background for buttons
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  // Quick Create Menu styles
  quickMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  quickMenuContainer: {
    position: 'absolute',
    width: Math.min(Dimensions.get('window').width - 32, 320),
    backgroundColor: '#f5f5f5',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#333333',
    padding: spacing.m * 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  quickMenuTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm * 1.3,
    color: '#333333',
    marginBottom: spacing.sm * 1.2,
  },
  quickMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickMenuItem: {
    width: '48%',
    height: 72,
    backgroundColor: '#ffffff',
    borderRadius: 36,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: '#333333',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickMenuItemIcon: {
    width: 26,
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  quickMenuItemLabel: {
    flexShrink: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md * 1.1,
    color: '#333333',
  },
});

export default HomeScreen;
```

- Added a temporary export/share button to the header in `src/screens/HomeScreen.tsx`. It copies `Library/LocalDatabase/adulting.db` to the app’s Documents and opens the iOS share sheet.
- Styling untouched elsewhere; added a minimal `headerExportButton` style to position the button without affecting layout.

How to use:
- Open the app’s Home screen.
- Tap the new share icon in the header.
- Choose “Save to Files” (iCloud/On My iPhone) or share to OneDrive/Google Drive/Email.
- Open the saved `adulting.db` in DB Browser (Browse Data → `emergency_contacts`).

---

**User**

Im getting this error when sharing:


---

**Cursor**

```typescriptreact
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  Switch,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/styleGuide';
import { motivationalPhrases } from '../constants/motivationalPhrases';
import styled from 'styled-components/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

// Icon type definition
type IconName = 'vacation' | 'dentist' | 'license' | 'documents' | 'travel' | 'reminders' | 'settings' | 'mealprep' | 'emergency' | 'digital_will' | 'vault' | 'pet_tracker' | 'add' | 'home';

// Icon component using Material Icons
const Icon = ({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) => {
  // Map icon names to Material Icons
  const iconMap: Record<IconName, { family: 'MaterialIcons' | 'MaterialCommunityIcons'; icon: string }> = {
    vacation: { family: 'MaterialIcons', icon: 'flight' },
    dentist: { family: 'MaterialIcons', icon: 'medical-services' },
    license: { family: 'MaterialIcons', icon: 'credit-card' },
    documents: { family: 'MaterialIcons', icon: 'description' },
    travel: { family: 'MaterialIcons', icon: 'luggage' },
    reminders: { family: 'MaterialIcons', icon: 'access-alarm' },
    settings: { family: 'MaterialIcons', icon: 'settings' },
    mealprep: { family: 'MaterialIcons', icon: 'restaurant' },
    emergency: { family: 'MaterialIcons', icon: 'emergency' },
    digital_will: { family: 'MaterialIcons', icon: 'gavel' },
    vault: { family: 'MaterialIcons', icon: 'security' },
    pet_tracker: { family: 'MaterialIcons', icon: 'pets' },
    add: { family: 'MaterialIcons', icon: 'add' },
    home: { family: 'MaterialIcons', icon: 'home' },
  };
  
  const iconData = iconMap[name];
  
  if (iconData.family === 'MaterialIcons') {
    return <MaterialIcons name={iconData.icon as any} size={size} color={color} />;
  } else {
    return <MaterialCommunityIcons name={iconData.icon as any} size={size} color={color} />;
  }
};

// Define types for our data
type UpcomingEvent = {
  id: string;
  title: string;
  icon: IconName;
  daysLeft: number;
  dateRange: string;
};

type MenuItem = {
  id: string;
  title: string;
  icon: IconName;
  description: string;
  route: keyof RootStackParamList;
};

// Sample upcoming events data
const upcomingEvents: UpcomingEvent[] = [
  {
    id: '1',
    title: 'Kruger Vacation Trip',
    icon: 'vacation',
    daysLeft: 22,
    dateRange: '12 July - 20 July',
  },
  {
    id: '2',
    title: 'Dentist Appointment',
    icon: 'dentist',
    daysLeft: 3,
    dateRange: '      23 June',
  },
  {
    id: '3',
    title: 'Vehicle License Expiring',
    icon: 'license',
    daysLeft: 34,
    dateRange: '23 June',
  },
];

// Menu items data - All 8 modules
const menuItems: MenuItem[] = [
  {
    id: '1',
    title: 'Mealprep',
    icon: 'mealprep',
    description: 'Recipes and Grocery List',
    route: 'Mealprep',
  },
  {
    id: '2',
    title: 'Documents',
    icon: 'documents',
    description: 'Store and access important files and values',
    route: 'Documents',
  },
  {
    id: '3',
    title: 'Emergency & Safety',
    icon: 'emergency',
    description: 'Emergency Contacts',
    route: 'Emergency',
  },
  {
    id: '4',
    title: 'Digital Will',
    icon: 'digital_will',
    description: 'Manage your digital legacy',
    route: 'DigitalWill',
  },
  {
    id: '5',
    title: 'Smart Reminders',
    icon: 'reminders',
    description: 'Set Reminders for important dates and tasks',
    route: 'SmartReminders',
  },
  {
    id: '6',
    title: 'Travel Assistant',
    icon: 'travel',
    description: 'Organize trips, itineraries, tickets and packing lists',
    route: 'TravelAssistant',
  },
  {
    id: '7',
    title: 'Vault',
    icon: 'vault',
    description: 'Secure storage for sensitive information',
    route: 'Vault',
  },
  {
    id: '8',
    title: 'Pet Tracker',
    icon: 'pet_tracker',
    description: 'Track your pets health and activities',
    route: 'PetTracker',
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Haptics helpers (optional at runtime)
const triggerSelectionHaptic = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const H = require('expo-haptics');
    if (H?.selectionAsync) {
      await H.selectionAsync();
    }
  } catch {}
};

const triggerLightImpactHaptic = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const H = require('expo-haptics');
    if (H?.impactAsync && H?.ImpactFeedbackStyle?.Light) {
      await H.impactAsync(H.ImpactFeedbackStyle.Light);
    }
  } catch {}
};

const triggerModuleCardHaptic = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const H = require('expo-haptics');
    // Example 1: Double heavy impact (stronger than single heavy)
    if (H?.impactAsync && H?.ImpactFeedbackStyle?.Heavy) {
      await Promise.all([
        H.impactAsync(H.ImpactFeedbackStyle.Heavy),
        H.impactAsync(H.ImpactFeedbackStyle.Heavy)
      ]);
    }
    
    // Example 2: Heavy impact + Success notification (very strong)
    // if (H?.impactAsync && H?.notificationAsync) {
    //   await Promise.all([
    //     H.impactAsync(H.ImpactFeedbackStyle.Heavy),
    //     H.notificationAsync(H.NotificationFeedbackType.Success)
    //   ]);
    // }
    
    // Example 3: Triple pattern (tap-tap-strong)
    // if (H?.impactAsync) {
    //   await H.impactAsync(H.ImpactFeedbackStyle.Light);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Light);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Heavy);
    // }
    
    // Example 4: Escalating pattern (light to heavy)
    // if (H?.impactAsync) {
    //   await H.impactAsync(H.ImpactFeedbackStyle.Light);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Medium);
    //   await new Promise(resolve => setTimeout(resolve, 50));
    //   await H.impactAsync(H.ImpactFeedbackStyle.Heavy);
    // }
    
    // Fallback to selection if haptics not available
    else if (H?.selectionAsync) {
      await H.selectionAsync();
    }
  } catch {}
};

// Quick Create Menu (inline to HomeScreen only)
const QuickCreateMenu = ({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (route: keyof RootStackParamList) => void;
}) => {
  const [shouldRender, setShouldRender] = React.useState(visible);
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const translateYAnim = React.useRef(new Animated.Value(12)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const backdropAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else if (shouldRender) {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 160, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 12, duration: 160, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start(() => setShouldRender(false));
    }
  }, [visible]);

  if (!shouldRender) return null;

  // Anchor the menu to the add button (approximate) so it looks like it grows from it
  const screenWidth = Dimensions.get('window').width;
  const menuWidth = Math.min(screenWidth - 32, 320);
  const bottomBarWidth = 185; // matches styles.bottomActionsContainer.width
  const centeredLeft = (screenWidth - menuWidth) / 2; // center horizontally
  const bottomOffset = spacing.xl + 70; // bottom actions bottom + actionButton height + margin

  const quickActions: Array<{ id: string; label: string; icon: IconName; route: keyof RootStackParamList }> = [
    { id: 'qa_docs', label: 'New Document', icon: 'documents', route: 'Documents' },
    { id: 'qa_vault', label: 'Vault Item', icon: 'vault', route: 'Vault' },
    { id: 'qa_dw', label: 'Digital Will Item', icon: 'digital_will', route: 'DigitalWill' },
    { id: 'qa_emerg', label: 'Emergency Contact', icon: 'emergency', route: 'Emergency' },
    { id: 'qa_recipe', label: 'New Recipe', icon: 'mealprep', route: 'Mealprep' },
    { id: 'qa_remind', label: 'Smart Reminder', icon: 'reminders', route: 'SmartReminders' },
  ];

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.quickMenuBackdrop, { opacity: backdropAnim }]}
      />
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.quickMenuContainer,
          {
            left: centeredLeft,
            bottom: bottomOffset,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <Text style={styles.quickMenuTitle}>QUICK CREATE</Text>
        <View style={styles.quickMenuGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.9}
              style={styles.quickMenuItem}
              onPress={() => {
                onSelect(action.route);
                onClose();
              }}
            >
              <View style={styles.quickMenuItemContent}>
                <View style={styles.quickMenuItemIcon}>
                  <Icon name={action.icon} color={colors.text.secondary} size={26} />
                </View>
                <Text style={styles.quickMenuItemLabel} numberOfLines={2} ellipsizeMode="tail">
                  {action.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

// Animated Tagline Component
const AnimatedTagline = () => {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const [currentPhrase, setCurrentPhrase] = React.useState(motivationalPhrases[0]);
  const phraseIndexRef = React.useRef(0);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  const animateNextPhrase = React.useCallback(() => {
    // Start fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      // Update phrase while invisible
      phraseIndexRef.current = (phraseIndexRef.current + 1) % motivationalPhrases.length;
      setCurrentPhrase(motivationalPhrases[phraseIndexRef.current]);
      
      // Start fade in
      Animated.timing(fadeAnim, {
        toValue: 6,
        duration: 3000,
        useNativeDriver: true,
      }).start();
      
      // Schedule next animation
      timeoutRef.current = setTimeout(animateNextPhrase, 4000);
    });
  }, [fadeAnim]);

  React.useEffect(() => {
    // Start first animation after initial delay
    timeoutRef.current = setTimeout(animateNextPhrase, 4000);
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      fadeAnim.stopAnimation();
    };
  }, [animateNextPhrase]);

  return (
    <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
      {currentPhrase}
    </Animated.Text>
  );
};

const HomeScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const { user, signOut } = useAuth();
  const [isGridView, setIsGridView] = React.useState(true);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  
  // Create animated values for each section
  const headerFade = React.useRef(new Animated.Value(0)).current;
  const upcomingFade = React.useRef(new Animated.Value(0)).current;
  const menuFade = React.useRef(new Animated.Value(0)).current;
  const actionsFade = React.useRef(new Animated.Value(0)).current;
  const [isQuickMenuOpen, setIsQuickMenuOpen] = React.useState(false);

  React.useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Fade in header
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Fade in upcoming section
      Animated.timing(upcomingFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Fade in menu section
      Animated.timing(menuFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Fade in bottom actions
      Animated.timing(actionsFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      console.log('Signed out successfully');
    }
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  const navigateToEventDetails = (eventId: string) => {
    console.log(`Navigate to event details: ${eventId}`);
  };

  const openModuleHome = async (route: keyof RootStackParamList) => {
    await triggerSelectionHaptic();
    navigation.navigate(route);
  };

  const openModuleCreate = async (route: keyof RootStackParamList) => {
    await triggerSelectionHaptic();
    switch (route) {
      case 'Documents':
        (navigation as any).navigate('Documents', { screen: 'AddDocument' });
        return;
      case 'Vault':
        (navigation as any).navigate('Vault', { screen: 'AddVaultItem' });
        return;
      case 'DigitalWill':
        (navigation as any).navigate('DigitalWill', { screen: 'AddDigitalWillItem' });
        return;
      case 'Emergency':
        (navigation as any).navigate('Emergency', { screen: 'AddEmergencyContact' });
        return;
      case 'Mealprep':
        (navigation as any).navigate('Mealprep', { screen: 'AddRecipe' });
        return;
      case 'SmartReminders':
        (navigation as any).navigate('SmartReminders', { screen: 'AddSmartReminder' });
        return;
      default:
        navigation.navigate(route);
        return;
    }
  };

  const toggleViewMode = (newValue: boolean) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Change view mode
      setIsGridView(newValue);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };
  
  const handleAddButtonPress = async () => {
    if (!isQuickMenuOpen) {
      await triggerLightImpactHaptic();
    } else {
      await triggerSelectionHaptic();
    }
    setIsQuickMenuOpen((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <Animated.View style={{ opacity: headerFade }}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <Image 
              source={require('../../src/assets/adulting-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            {/* TEMP: Export DB button (iOS share) */}
            <TouchableOpacity
              onPress={async () => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const FileSystem = require('expo-file-system');
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const Sharing = require('expo-sharing');
                  const candidates: string[] = [];
                  if (FileSystem.documentDirectory) {
                    candidates.push(FileSystem.documentDirectory + 'SQLite/adulting.db');
                  }
                  if (FileSystem.libraryDirectory) {
                    candidates.push(FileSystem.libraryDirectory + 'SQLite/adulting.db');
                    candidates.push(FileSystem.libraryDirectory + 'LocalDatabase/adulting.db');
                  }

                  let src: string | null = null;
                  for (const p of candidates) {
                    try {
                      const info = await FileSystem.getInfoAsync(p);
                      if (info?.exists) { src = p; break; }
                    } catch {}
                  }

                  if (!src) {
                    console.warn('DB file not found in expected locations:', candidates);
                    return;
                  }

                  const dst = (FileSystem.documentDirectory || '') + 'adulting.db';
                  await FileSystem.copyAsync({ from: src, to: dst });
                  if (Sharing && (await Sharing.isAvailableAsync?.())) {
                    await Sharing.shareAsync(dst);
                  }
                } catch (e) {
                  console.error('DB export failed', e);
                }
              }}
              activeOpacity={0.8}
              style={styles.headerExportButton}
            >
              <MaterialIcons name="ios-share" size={22} color="#ffffff" />
            </TouchableOpacity>
            <AnimatedTagline />
          </View>
        </SafeAreaView>
      </Animated.View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Events Section */}
                <Animated.View style={[styles.section, { opacity: upcomingFade }]}>
          <View style={styles.upcomingHeader}>
            <View style={styles.sectionTitleCard}>
              <Text style={styles.sectionTitleMain}>NEXT UP</Text>
            </View>
            
            <View style={[styles.upcomingCard, { marginTop: 5 }]}>
            {upcomingEvents.map((event, index) => (
              <View key={event.id}>
                <TouchableOpacity
                  style={styles.eventItem}
                  onPress={() => navigateToEventDetails(event.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.eventContent}>
                    <View style={styles.eventIconContainer}>
                      <Icon name={event.icon} color="white" size={28} />
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDate}>
                        In {event.daysLeft} days{ '\t' }{event.dateRange}
                      </Text>
                    </View>
                    <LinearGradient
                      colors={['#028de5', '#d85ff2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1.2, y: 1.3 }}
                      style={styles.chevronContainer}
                    >
                      <MaterialIcons name="chevron-right" size={32} color="white" />
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                {index < upcomingEvents.length - 1 && <View style={styles.eventSeparator} />}
              </View>
            ))}
            </View>
          </View>
        </Animated.View>
        
        {/* Menu Section */}
        <Animated.View style={[styles.section, { opacity: menuFade }]}>
          <View style={styles.menuHeader}>
            <Text style={styles.sectionTitle}>MENU</Text>
                        <View style={styles.viewToggleContainer}>
              <View style={styles.switchContainer}>
                <Switch
                  value={isGridView}
                  onValueChange={toggleViewMode}
                  trackColor={{ false: '#e0e0e0', true: '#e0e0e0' }}
                  thumbColor="#333333"
                  ios_backgroundColor="#e0e0e0"
                  style={{ transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }] }}
                />
                <View style={styles.switchIconsContainer}>
                  <MaterialIcons 
                    name="view-list" 
                    size={20} 
                    color={!isGridView ? "#e6e6e6" : "#999"} 
                    style={styles.switchIconLeft}
                  />
                  <MaterialIcons 
                    name="grid-view" 
                    size={20} 
                    color={isGridView ? "#e6e6e6" : "#636363"}
                    style={styles.switchIconRight}
                  />
                </View>
              </View>
            </View>
          </View>
          
          <Animated.View style={{ opacity: fadeAnim }}>
            {isGridView ? (
              <View style={styles.menuGridContainer}>
                {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuGridCard}
                  onPress={() => openModuleHome(item.route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuGridContent}>
                    <View style={styles.menuGridIconContainer}>
                      <Icon name={item.icon} color={colors.text.secondary} size={28} />
                    </View>
                    <Text style={styles.menuGridTitle}>{item.title}</Text>
                                         <Text style={styles.menuGridDescription}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              </View>
            ) : (
              <View style={styles.menuContainer}>
                {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuCard}
                  onPress={() => openModuleHome(item.route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuContent}>
                    <View style={styles.menuIconContainer}>
                      <Icon name={item.icon} color={colors.text.secondary} size={28} />
                    </View>
                    <View style={styles.menuDetails}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
      
      {/* Bottom Action Buttons */}
      <Animated.View style={{ opacity: actionsFade }}>
        <LinearGradient
        colors={['#028de5', '#d85ff2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.2, y: 1.9 }}
        style={styles.bottomActionsContainer}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAddButtonPress}
          activeOpacity={0.8}
        >
          <Icon name="add" color="white" size={32} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToSettings}
          activeOpacity={0.8}
        >
          <Icon name="settings" color="white" size={28} />
        </TouchableOpacity>
      </LinearGradient>
      </Animated.View>

      {/* Quick Create Menu Overlay (render last to sit on top) */}
      <QuickCreateMenu
        visible={isQuickMenuOpen}
        onClose={() => setIsQuickMenuOpen(false)}
        onSelect={(route) => openModuleCreate(route)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  headerSafeArea: {
    backgroundColor: colors.background.dark,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 5,
    height: 85,
  },
  logo: {
    width: 250,
    height: 45,
  },
  headerExportButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.light,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 150, // Increased extra space at the bottom to ensure content goes beyond SafeAreaView
  },
  section: {
    marginBottom: spacing.xl,
  },
  upcomingHeader: {
    paddingTop: (typography.fontSize.xxl + spacing.xs * 2 ) / 2,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  sectionTitleCard: {
    backgroundColor: colors.background.light,
    borderWidth: 0, //next up text card
    borderColor: colors.thirdly,
    borderRadius: 25,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignSelf: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  sectionTitleMain: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text.thirdly,
    alignSelf: 'center',
  },
  upcomingCard: {
    backgroundColor: '#333333',
    borderRadius: 35,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  eventItem: {
    // No individual background or border radius
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  eventIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    opacity: 0.8,
  },
  eventSeparator: {
    height: 1,
    backgroundColor: colors.text.white,
    opacity: 0.2,
    marginLeft: spacing.lg,
    marginRight: spacing.lg,
  },
  chevronContainer: {
    width: 65, // Increased by 15px from 50px
    height: 50,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: typography.fontSize.xl , // Match the height of section title text plus padding
  },
  switchContainer: {
    position: 'relative',
    justifyContent: 'flex-start',
    marginRight: spacing.m,
  },
  switchIconsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    pointerEvents: 'none',
  },
  switchIconLeft: {
    marginLeft: -2,
  },
  switchIconRight: {
    marginRight: -2,
  },
  menuContainer: {
    gap: 5, // Reduced spacing between menu items to 5px
  },
  menuCard: {
    backgroundColor: '#f5f5f5', // Very light grey background (same as grid)
    borderRadius: 35, // Increased corner radius
    padding: spacing.md, // Reduced padding inside the card
    marginBottom: 5, // Reduced margin between cards to 5px
    minHeight: 80, // Ensure enough height to display content
    borderWidth: 2,
    borderColor: '#333333', // Dark grey border (same as Upcoming card)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuGridCard: {
    width: '48%',
    backgroundColor: '#f5f5f5', // Very light grey background
    borderRadius: 35,
    padding: spacing.md,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#333333', // Dark grey border (same as Upcoming card)
    minHeight: 140, // Ensure enough height to display content
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center', // Center items vertically
    paddingVertical: 4, // Add minimal vertical padding
  },
  menuIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm, // Reduced right margin
  },
  menuDetails: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl, // Increased text size
    color: '#333333', // Dark grey text (same as grid)
    marginBottom: 2, // Reduced space between title and description
  },
  menuDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md, // Increased text size
    color: '#333333', // Dark grey text (same as grid)
    opacity: 0.9,
    lineHeight: typography.fontSize.md * 1.2, // Reduced line height for tighter text
  },
  menuGridContent: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  menuGridIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  menuGridTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: '#333333', // Dark grey text (same as border)
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  menuGridDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#333333', // Dark grey text (same as border)
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.2,
  },
  bottomActionsContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 50,
    paddingVertical: 3,
    paddingHorizontal: 3,
    width: 185, // Fixed width for the container
    height: 60,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  actionButton: {
    width: 80,
    height: 50,
    borderRadius: 40,
    backgroundColor: '#000000', // Black background for buttons
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  // Quick Create Menu styles
  quickMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  quickMenuContainer: {
    position: 'absolute',
    width: Math.min(Dimensions.get('window').width - 32, 320),
    backgroundColor: '#f5f5f5',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#333333',
    padding: spacing.m * 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  quickMenuTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm * 1.3,
    color: '#333333',
    marginBottom: spacing.sm * 1.2,
  },
  quickMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickMenuItem: {
    width: '48%',
    height: 72,
    backgroundColor: '#ffffff',
    borderRadius: 36,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: '#333333',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickMenuItemIcon: {
    width: 26,
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  quickMenuItemLabel: {
    flexShrink: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md * 1.1,
    color: '#333333',
  },
});

export default HomeScreen;
```

- Cause: The DB path differed on device. We were assuming Library/LocalDatabase only; on iOS it can be in Library/SQLite or DocumentDirectory/SQLite depending on runtime.
- Fix: The export button now probes these locations and picks the first existing:
  - DocumentDirectory/SQLite/adulting.db
  - Library/SQLite/adulting.db
  - Library/LocalDatabase/adulting.db

How to use:
- Tap the header share icon again.
- Choose Save to Files or a cloud provider, then open `adulting.db` in DB Browser.

If nothing shares:
- The button logs all checked paths to help confirm where the file lives. Make sure you’ve triggered any DB operations first so the file is created.

---

**User**

Alright, ive inspected the database and i can see the database looks correct and the data for Emergency contacts is empty. 
Remove the dummy data currently being displayed and instead show the empty list of items. Ensure the CRUD functionality is implemented so that can create my own items.

---

**Cursor**

I’m going to scan the emergency screens to see how the list and edit flows are implemented now, so I can wire them to the new SQLite service without changing UI styling. Then I’ll make the necessary edits and ensure type-safe, minimal changes.

I’m going to implement CRUD by:
- Adding get-by-id, update, and delete functions in the SQLite service.
- Wiring `EmergencyContactsScreen` to load from SQLite instead of dummy data.
- Wiring `AddEmergencyContactScreen` to insert into SQLite.
- Wiring `EditEmergencyContactScreen` to load/update/delete via SQLite.

Then I’ll run linter checks on the modified files.

```typescript
import * as SQLite from 'expo-sqlite';

export type EmergencyContact = {
	id: string;
	userId: string;
	title: string;
	phoneNumber: string;
	icon: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDbAsync(): Promise<SQLite.SQLiteDatabase> {
	if (!dbPromise) {
		dbPromise = SQLite.openDatabaseAsync('adulting.db');
	}
	return dbPromise;
}

function generateUuidV4(): string {
	// Lightweight UUID v4 generator without extra deps
	// eslint-disable-next-line no-bitwise
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = (Math.random() * 16) | 0;
		// eslint-disable-next-line no-bitwise
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export async function initializeEmergencyContactsDb(): Promise<void> {
	// Schema per Emergency_Contacts_Module_Database_Schema_MINIMAL.md
	const db = await getDbAsync();
	await db.execAsync(`PRAGMA foreign_keys = ON;`);
	await db.execAsync(
		`CREATE TABLE IF NOT EXISTS emergency_contacts (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			title TEXT NOT NULL,
			phone_number TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT 'local-hospital'
		);`
	);
	await db.execAsync(
		`CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);`
	);
}

export async function insertEmergencyContact(params: {
	userId: string;
	title: string;
	phoneNumber: string;
	icon?: string;
}): Promise<EmergencyContact> {
	const id = generateUuidV4();
	const icon = params.icon ?? 'local-hospital';
	const db = await getDbAsync();
	await db.runAsync(
		`INSERT INTO emergency_contacts (id, user_id, title, phone_number, icon) VALUES (?, ?, ?, ?, ?);`,
		[id, params.userId, params.title, params.phoneNumber, icon]
	);
	return { id, userId: params.userId, title: params.title, phoneNumber: params.phoneNumber, icon };
}

export async function getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
	const db = await getDbAsync();
	const rows = await db.getAllAsync<{
		id: string;
		userId: string;
		title: string;
		phoneNumber: string;
		icon: string;
	}>(
		`SELECT id, user_id as userId, title, phone_number as phoneNumber, icon
		 FROM emergency_contacts
		 WHERE user_id = ?
		 ORDER BY title COLLATE NOCASE ASC;`,
		[userId]
	);
	return rows as unknown as EmergencyContact[];
}

export async function clearEmergencyContactsForUser(userId: string): Promise<number> {
	const db = await getDbAsync();
	const result = await db.runAsync(`DELETE FROM emergency_contacts WHERE user_id = ?;`, [userId]);
	// result.changes contains number of affected rows
	// @ts-ignore
	return (result as any)?.changes ?? 0;
}

export async function countEmergencyContacts(userId: string): Promise<number> {
	const db = await getDbAsync();
	const row = await db.getFirstAsync<{ count: number }>(
		`SELECT COUNT(*) as count FROM emergency_contacts WHERE user_id = ?;`,
		[userId]
	);
	return row?.count ?? 0;
}

export async function debugDumpAll(): Promise<EmergencyContact[]> {
	const db = await getDbAsync();
	const rows = await db.getAllAsync<{
		id: string;
		userId: string;
		title: string;
		phoneNumber: string;
		icon: string;
	}>(
		`SELECT id, user_id as userId, title, phone_number as phoneNumber, icon FROM emergency_contacts ORDER BY user_id, title;`
	);
	return rows as unknown as EmergencyContact[];
}

export async function getEmergencyContactById(id: string): Promise<EmergencyContact | null> {
	const db = await getDbAsync();
	const row = await db.getFirstAsync<{
		id: string;
		userId: string;
		title: string;
		phoneNumber: string;
		icon: string;
	}>(
		`SELECT id, user_id as userId, title, phone_number as phoneNumber, icon FROM emergency_contacts WHERE id = ?;`,
		[id]
	);
	return (row as unknown as EmergencyContact) || null;
}

export async function updateEmergencyContact(params: {
	id: string;
	userId: string;
	title: string;
	phoneNumber: string;
	icon: string;
}): Promise<void> {
	const db = await getDbAsync();
	await db.runAsync(
		`UPDATE emergency_contacts SET title = ?, phone_number = ?, icon = ? WHERE id = ? AND user_id = ?;`,
		[params.title, params.phoneNumber, params.icon, params.id, params.userId]
	);
}

export async function deleteEmergencyContact(id: string): Promise<void> {
	const db = await getDbAsync();
	await db.runAsync(`DELETE FROM emergency_contacts WHERE id = ?;`, [id]);
}



```

```typescriptreact
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius, components } from '../../styles/styleGuide';
import { EmergencyStackParamList } from '../../navigation/EmergencyNavigator';
import { useAuth } from '../../context/AuthContext';
import { getEmergencyContacts, type EmergencyContact } from '../../services/emergencyContactsDb';

type UiContact = { id: string; title: string; phone: string; icon: any };

type NavigationProp = NativeStackNavigationProp<EmergencyStackParamList>;

const EmergencyContactsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<UiContact[]>([]);

  const refresh = async () => {
    if (!user?.id) return;
    const rows = await getEmergencyContacts(user.id);
    const ui: UiContact[] = rows.map((r: EmergencyContact) => ({ id: r.id, title: r.title, phone: r.phoneNumber, icon: r.icon as any }));
    setContacts(ui);
  };

  useEffect(() => {
    refresh();
    const unsubscribe = navigation.addListener?.('focus', () => {
      refresh();
    });
    return unsubscribe as any;
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return contacts.filter(c =>
      c.title.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [searchQuery, contacts]);

  const handleCall = (phone: string) => {
    Alert.alert('Call Contact', `Do you want to call ${phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', style: 'default', onPress: () => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`) },
    ]);
  };

  const handleEdit = (contactId: string) => {
    navigation.navigate('EditEmergencyContact', { contactId });
  };

  const handleAdd = () => {
    navigation.navigate('AddEmergencyContact');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency & Safety</Text>
        </View>
      </SafeAreaView>

      {/* Main Content Card */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Contacts List */}
        <View style={styles.listContainer}>
          {filtered.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardContent}>
                <MaterialIcons name={c.icon} size={24} color={colors.text.secondary} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <Text style={styles.cardSubtitle}>{c.phone}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionButtonRedCall} onPress={() => handleCall(c.phone)}>
                    <MaterialIcons name="call" size={20} color={colors.text.white} />
                    
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButtonIconOnly} onPress={() => handleEdit(c.id)}>
                    <MaterialIcons name="edit" size={20} color={colors.text.white} />
                    
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          {filtered.length === 0 && (
            <Text style={{ color: colors.text.secondary, opacity: 0.7, textAlign: 'center', marginTop: spacing.md }}>
              No emergency contacts yet
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={components.bottomActionButton.container} onPress={handleAdd}>
        <MaterialIcons name="add" size={24} color={colors.text.white} style={components.bottomActionButton.icon} />
        <Text style={components.bottomActionButton.text}>Add New</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  headerSafeArea: {
    backgroundColor: colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xxl,
    minHeight: 80,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.light,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 150,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    height: 48,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
  },
  listContainer: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.background.light,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#333333',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.l,
  },
  cardInfo: {
    marginLeft: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xlx,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    opacity: 0.7,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.thirdly,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.xxl,
    minWidth: 90,
  },
  actionButtonRedCall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.error,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.xxl,
    minWidth: 90,
  },
  actionButtonIconOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.thirdly,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xxl,
    minWidth: 40,
  },

  actionButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    marginLeft: spacing.xs,
  },
});

export default EmergencyContactsScreen; 
```

```typescriptreact
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius, components, shadows } from '../../styles/styleGuide';
import { EmergencyStackParamList } from '../../navigation/EmergencyNavigator';
import { useAuth } from '../../context/AuthContext';
import { insertEmergencyContact } from '../../services/emergencyContactsDb';

const iconOptions = [
  'local-hospital',
  'security',
  'local-fire-department',
  'support-agent',
  'healing',
  'medical-services',
  'call',
  'contact-phone',
  'perm-contact-cal',
] as const;

type IconName = typeof iconOptions[number];

type NavigationProp = NativeStackNavigationProp<EmergencyStackParamList>;

const AddEmergencyContactScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<IconName>('local-hospital');

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a contact title');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    try {
      if (!user?.id) throw new Error('No user');
      await insertEmergencyContact({ userId: user.id, title: title.trim(), phoneNumber: phone.trim(), icon: selectedIcon });
      Alert.alert('Success', 'Emergency contact saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Emergency Contact</Text>
        </View>
      </SafeAreaView>

      {/* Main Content Card */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contact Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contact Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter contact title"
            placeholderTextColor={colors.text.placeholder}
          />
        </View>

        {/* Phone Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor={colors.text.placeholder}
            keyboardType="phone-pad"
          />
        </View>

        {/* Icon Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {iconOptions.map((icon) => {
              const isSelected = selectedIcon === icon;
              return (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, isSelected && styles.iconOptionSelected]}
                  onPress={() => setSelectedIcon(icon)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name={icon} size={24} color={isSelected ? colors.text.white : colors.text.secondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Spacer for floating button */}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Floating Save Button */}
      <TouchableOpacity style={components.bottomActionButton.container} onPress={handleSave}>
        <MaterialIcons name="save" size={24} color={colors.text.white} style={components.bottomActionButton.icon} />
        <Text style={components.bottomActionButton.text}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  headerSafeArea: {
    backgroundColor: colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xxl,
    minHeight: 80,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.light,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  iconOptionSelected: {
    backgroundColor: colors.button.thirdly,
    borderColor: colors.button.thirdly,
  },
});

export default AddEmergencyContactScreen; 
```

```typescriptreact
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/styleGuide';
import { EmergencyStackParamList } from '../../navigation/EmergencyNavigator';
import { useAuth } from '../../context/AuthContext';
import { getEmergencyContactById, updateEmergencyContact, deleteEmergencyContact } from '../../services/emergencyContactsDb';

const iconOptions = [
  'local-hospital',
  'security',
  'local-fire-department',
  'support-agent',
  'healing',
  'medical-services',
  'call',
  'contact-phone',
  'perm-contact-cal',
] as const;

type IconName = typeof iconOptions[number];

type NavigationProp = NativeStackNavigationProp<EmergencyStackParamList>;

type RoutePropType = RouteProp<EmergencyStackParamList, 'EditEmergencyContact'>;

const EditEmergencyContactScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { contactId } = route.params;
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<IconName>('local-hospital');

  React.useEffect(() => {
    (async () => {
      const row = await getEmergencyContactById(contactId);
      if (row) {
        setTitle(row.title);
        setPhone(row.phoneNumber);
        setSelectedIcon(row.icon as IconName);
      }
    })();
  }, [contactId]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a contact title');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }
    try {
      if (!user?.id) throw new Error('No user');
      await updateEmergencyContact({ id: contactId, userId: user.id, title: title.trim(), phoneNumber: phone.trim(), icon: selectedIcon });
      Alert.alert('Success', 'Emergency contact updated', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update contact');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Contact', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteEmergencyContact(contactId);
          navigation.goBack();
        } catch (e) {
          console.error(e);
          Alert.alert('Error', 'Failed to delete contact');
        }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Emergency Contact</Text>
        </View>
      </SafeAreaView>

      {/* Main Content Card */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contact Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contact Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter contact title"
            placeholderTextColor={colors.text.placeholder}
          />
        </View>

        {/* Phone Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor={colors.text.placeholder}
            keyboardType="phone-pad"
          />
        </View>

        {/* Icon Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {iconOptions.map((icon) => {
              const isSelected = selectedIcon === icon;
              return (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, isSelected && styles.iconOptionSelected]}
                  onPress={() => setSelectedIcon(icon)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name={icon} size={24} color={isSelected ? colors.text.white : colors.text.secondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <MaterialIcons name="save" size={24} color={colors.text.white} />
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <MaterialIcons name="delete" size={24} color={colors.text.white} />
            <Text style={styles.buttonText}>Delete Contact</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  headerSafeArea: {
    backgroundColor: colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xxl,
    minHeight: 80,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.light,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  iconOptionSelected: {
    backgroundColor: colors.button.thirdly,
    borderColor: colors.button.thirdly,
  },
  buttonContainer: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  saveButton: {
    backgroundColor: colors.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xxl,
    ...shadows.sm,
  },
  deleteButton: {
    backgroundColor: colors.text.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xxl,
    ...shadows.sm,
  },
  buttonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    marginLeft: spacing.xs,
  },
});

export default EditEmergencyContactScreen; 
```

- Removed dummy list and now load from SQLite using `getEmergencyContacts(user.id)` in `src/screens/emergency/EmergencyContactsScreen.tsx`. Shows “No emergency contacts yet” when empty.
- Add screen now inserts into SQLite via `insertEmergencyContact` and returns to list.
- Edit screen now loads the row by id, updates, and deletes via new service methods.

New service functions in `src/services/emergencyContactsDb.ts`:
- `getEmergencyContactById`
- `updateEmergencyContact`
- `deleteEmergencyContact`

Usage:
- Go to Emergency & Safety → Add New to create entries.
- Tap edit to update/delete.
- The list reflects the actual DB contents for the signed-in mock user.

---

**User**

Go ahead and write a short summary of everything you did (related to)  implement successful CRUD functionality for the Emergency Contact module.
Write this as an approach to follow for all future modules for reference while building, that we stay consistent with our methods.

---

**Cursor**

### Emergency Contacts CRUD: Repeatable Approach

- Core principle: derive the database strictly from UI fields; don’t change styling or flows, only wire data.

- Plan schema from screens
  - Identify inputs from the Add/Edit screens.
  - Write a minimal schema doc for the module (example: `Emergency_Contacts_Module_Database_Schema_MINIMAL.md`).
  - Keep only essential columns + `id`, `user_id`; avoid timestamps unless UI needs them.

- Dependencies and versions
  - Use `expo-sqlite` with SDK-compatible install.
  - If npm peer conflicts occur, install with `--legacy-peer-deps`.
  - Use the async API: `openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`.

- Create a module DB service
  - File: `src/services/<module>Db.ts`
  - Include:
    - `initialize<Module>Db()` to create tables and indexes.
    - Create: `insert<Module>...`
    - Read list: `get<Module>...`
    - Read single: `get<Module>ById`
    - Update: `update<Module>...`
    - Delete: `delete<Module>...`
  - Use clear, typed models (e.g., `EmergencyContact`).
  - Keep naming aligned to column names (map UI names to DB names).

- Initialize DB on app start
  - In `App.tsx`, call `initialize<Module>Db()` inside a `useEffect`.
  - In DEV, expose optional debug helpers on `global` for quick introspection.

- Wire screens to the DB
  - List screen (e.g., `EmergencyContactsScreen.tsx`):
    - Remove dummy data; maintain the same list UI.
    - Load user-scoped rows with `get<Module>(user.id)`.
    - Refresh on screen focus (navigation listener).
    - Show an empty-state message when no rows.
  - Add screen (e.g., `AddEmergencyContactScreen.tsx`):
    - Validate inputs as-is; on save, call `insert<Module>...`.
    - Navigate back and rely on list refresh.
  - Edit screen (e.g., `EditEmergencyContactScreen.tsx`):
    - Load record with `get<Module>ById(id)`.
    - Update with `update<Module>...`; Delete with `delete<Module>...`.
    - Preserve existing UI/alerts/navigation.

- User scoping
  - Use `user.id` from `useAuth()` for `user_id`.
  - This ensures isolation per user across all modules.

- Testing and viewing data
  - iOS (Expo Go + Windows): add a temporary export action that:
    - Probes `DocumentDirectory/SQLite`, `Library/SQLite`, `Library/LocalDatabase` for the DB file.
    - Copies to `DocumentDirectory` and triggers `expo-sharing`.
    - Remove after QA is done.
  - Quick check in dev: `debugDumpAll()` from global or a temporary UI hook.

- Error handling and logs
  - Wrap DB actions in try/catch; log concise errors.
  - Maintain an issues log (e.g., `LOCAL_SQLITE_DB_SETUP_ISSUES.md`) for SDK/API changes and platform quirks.

- Consistency rules for future modules
  - Keep DB service per module in `src/services/`.
  - Use the same async SQLite API and typed helpers.
  - Don’t alter UI components; only replace data sources.
  - Always refresh list screens on focus after create/update/delete.
  - Keep schema minimal and screen-driven; document it alongside other schemas.
  - Reuse the same user scoping pattern.
  - Prefer dev-only export or console helpers for inspection; remove after verification.

- What we implemented for Emergency Contacts
  - Schema doc: minimal table with `id`, `user_id`, `title`, `phone_number`, `icon`.
  - DB service: `initializeEmergencyContactsDb`, `insertEmergencyContact`, `getEmergencyContacts`, `getEmergencyContactById`, `updateEmergencyContact`, `deleteEmergencyContact`, `debugDumpAll`.
  - App init: DB initialized in `App.tsx`.
  - Screen wiring:
    - `EmergencyContactsScreen.tsx`: loads from SQLite, shows empty state, refreshes on focus.
    - `AddEmergencyContactScreen.tsx`: inserts into SQLite.
    - `EditEmergencyContactScreen.tsx`: loads by id, updates, deletes.
  - Temporary export button in `HomeScreen.tsx` to share `adulting.db` for inspection (to be removed later).

---

**User**

Use this Approach weve just given to write a Guide for yourself to implement the CRUD with SQLite for any other modules the same way. So that we stay consistent with our methods.

---

**Cursor**

```markdown
## SQLite CRUD Implementation Guide (Reusable Across Modules)

This guide defines a consistent approach for implementing local SQLite CRUD for any module in this app. It preserves existing UI and wiring while swapping the data source to SQLite.

### Principles
- Derive schema strictly from screen inputs; avoid unnecessary fields
- Keep module data isolated by `user_id`
- Use Expo SQLite async API only: `openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`
- Keep changes scoped: do not alter component styling/UX, only data wiring

### 1) Plan a Minimal Schema
1. Identify user-entered fields from Add/Edit screens
2. Define a minimal table with columns for: `id`, `user_id`, and those exact fields
3. Add essential index(es) (usually `user_id`)
4. Save a brief schema doc: `adulting-v4/context-files/database-schema-design/<MODULE>_Database_Schema_MINIMAL.md`

### 2) Create a Module DB Service
File: `src/services/<module>Db.ts`

Must include:
- `initialize<Module>Db()` — creates table(s) and indexes
- `insert<Module>(...)` — create
- `get<Module>List(userId: string)` — list items for a user
- `get<Module>ById(id: string)` — fetch single
- `update<Module>(...)` — update record
- `delete<Module>(id: string)` — delete record
- Optionally: `debugDumpAll()` for dev diagnostics

Template:
```ts
import * as SQLite from 'expo-sqlite';

export type ModuleItem = {
  id: string;
  userId: string;
  // add module-specific fields here, e.g. title, note, etc.
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
async function getDbAsync(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('adulting.db');
  return dbPromise;
}

export async function initializeModuleDb(): Promise<void> {
  const db = await getDbAsync();
  await db.execAsync(`PRAGMA foreign_keys = ON;`);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS module_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      /* module fields */
      title TEXT NOT NULL
    );
  `);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_module_items_user_id ON module_items(user_id);`);
}

export async function insertModuleItem(params: { userId: string; title: string; /* other fields */ }): Promise<ModuleItem> {
  const id = generateUuidV4();
  const db = await getDbAsync();
  await db.runAsync(`INSERT INTO module_items (id, user_id, title) VALUES (?, ?, ?);`, [id, params.userId, params.title]);
  return { id, userId: params.userId, title: params.title } as ModuleItem;
}

export async function getModuleList(userId: string): Promise<ModuleItem[]> {
  const db = await getDbAsync();
  const rows = await db.getAllAsync<ModuleItem>(
    `SELECT id, user_id as userId, title FROM module_items WHERE user_id = ? ORDER BY title COLLATE NOCASE;`,
    [userId]
  );
  return rows as ModuleItem[];
}

export async function getModuleById(id: string): Promise<ModuleItem | null> {
  const db = await getDbAsync();
  const row = await db.getFirstAsync<ModuleItem>(
    `SELECT id, user_id as userId, title FROM module_items WHERE id = ?;`,
    [id]
  );
  return (row as ModuleItem) || null;
}

export async function updateModuleItem(params: { id: string; userId: string; title: string }): Promise<void> {
  const db = await getDbAsync();
  await db.runAsync(`UPDATE module_items SET title = ? WHERE id = ? AND user_id = ?;`, [params.title, params.id, params.userId]);
}

export async function deleteModuleItem(id: string): Promise<void> {
  const db = await getDbAsync();
  await db.runAsync(`DELETE FROM module_items WHERE id = ?;`, [id]);
}

function generateUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

### 3) Initialize DB on App Start
- In `App.tsx`, add:
  - imports of each `initialize<Module>Db`
  - a `useEffect` that calls these init functions once
  - optional: expose debug helpers on `global` when `__DEV__`

Example:
```ts
useEffect(() => {
  initializeModuleDb().catch(e => console.error('DB init error', e));
  if (__DEV__) {
    // @ts-ignore
    global.moduleDb = { getModuleList };
  }
}, []);
```

### 4) Wire Screens to SQLite (No UI Changes)
- List screen:
  - Replace dummy data with `const [items, setItems] = useState([])`
  - Load via `getModuleList(user.id)` in `useEffect`
  - Refresh on focus: `navigation.addListener('focus', refresh)`
  - Keep the same render/item components; add a simple empty state if needed

- Add screen:
  - On save, validate inputs and call `insertModuleItem({...})`
  - Navigate back; rely on list’s focus refresh

- Edit screen:
  - Load record with `getModuleById(id)` on mount
  - On save, call `updateModuleItem({...})`
  - For delete, prompt the user and then `deleteModuleItem(id)`

### 5) User Scoping
- Always pass `user.id` from `useAuth()` to create/list/update
- Never display or modify other users’ data locally

### 6) Testing and Viewing Data
- iOS (Expo Go + Windows): optionally add a temporary export action that probes these paths and shares the DB:
  - `DocumentDirectory/SQLite/<db>.db`
  - `Library/SQLite/<db>.db`
  - `Library/LocalDatabase/<db>.db`
- Use `expo-file-system` + `expo-sharing` to copy to `DocumentDirectory` and open a share sheet
- Remove the export action after QA

### 7) Error Handling and Logs
- Wrap DB calls in try/catch
- Log concise errors; show friendly alerts in UI
- Maintain an issues log: `adulting-v4/context-files/build-guide/LOCAL_SQLITE_DB_SETUP_ISSUES.md`

### 8) Naming and Types
- Service file per module: `src/services/<module>Db.ts`
- Type names are explicit and descriptive
- Column names mirror schema; transforms handled in service mapping if needed

### 9) Checklist for Each Module
- Minimal schema doc created
- Service with init + full CRUD implemented
- App init calls service init
- List, Add, Edit screens wired to service (no styling changes)
- User scoping applied
- Optional: temp DB export for QA, then remove


```

- Added `adulting-v4/context-files/build-guide/CRUD_SQLITE_IMPLEMENTATION_GUIDE.md` with a concise, repeatable process for implementing SQLite CRUD across modules.
- Covers schema planning, async SQLite API usage, per-module service design, app initialization, wiring list/add/edit screens, user scoping, testing/exporting on iOS, error handling, and a checklist.

