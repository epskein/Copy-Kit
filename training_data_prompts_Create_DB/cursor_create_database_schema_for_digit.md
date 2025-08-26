r# Create database schema for digital will module
_Exported on 8/25/2025 at 18:54:02 GMT+2 from Cursor (1.4.5)_

---

**User**

I want you to look at @Digital_Will_Module_Database_Schema.md  as an example for i want you to create.
Analyse the fields entered by the user on @AddDigitalWillItemScreen.tsx  to determine the fields and tables needed to create and store the data in a database. Create a new Database Scheme markdown for the Digital Will module only. This should be located under /context-files/db-schema-design-new.
Dont add unnecesary fields.
Dont change any of the styling or functionality. Only plan the database. 


---

**Cursor**

I'm going to add a new minimal SQLite schema markdown for the Digital Will module under `adulting-v4/context-files/db-schema-design-new`, derived strictly from the fields on `AddDigitalWillItemScreen.tsx` (`title`, `content`) plus `id` and `user_id`, and include the essential index on `user_id`.

```markdown
# Digital Will Module — Minimal SQLite Database Schema

## Overview
This minimal schema is derived strictly from the inputs present on `src/screens/digitalWill/AddDigitalWillItemScreen.tsx`.

User-entered fields on that screen:
- `title`
- `content`

Per local data principles, we also include `id` and `user_id` (to isolate data per user). No additional fields are added.

## Tables

### 1) digital_will_items
Stores each Digital Will item created via the Add screen.

| Column   | Type     | Constraints                 | Description                  |
|----------|----------|-----------------------------|------------------------------|
| id       | INTEGER  | PRIMARY KEY AUTOINCREMENT   | Local row identifier         |
| user_id  | TEXT     | NOT NULL                    | Current signed-in user id    |
| title    | TEXT     | NOT NULL                    | Will item title              |
| content  | TEXT     | NOT NULL                    | Will item content/instructions |

## Indexes
- `CREATE INDEX` on `user_id` for quick filtering per user.

## SQLite DDL
```sql
CREATE TABLE IF NOT EXISTS digital_will_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_digital_will_items_user_id
  ON digital_will_items(user_id);
```

## Notes
- This schema is intentionally minimal and aligned only to the current Add screen fields. It does not include categories, attachments, flags, or timestamps.
- `user_id` should be supplied from the authentication context when inserting records.
- Future fields/screens can be added via `ALTER TABLE ... ADD COLUMN` without disrupting existing data.


```

Status: I analyzed `src/screens/digitalWill/AddDigitalWillItemScreen.tsx` and created a minimal, user-input–driven schema. I added a new markdown under `adulting-v4/context-files/db-schema-design-new` with only `id`, `user_id`, `title`, and `content`, plus an index on `user_id`.

New file created:
- `adulting-v4/context-files/db-schema-design-new/Digital_Will_Module_Database_Schema_MINIMAL.md`

Key points:
- Derived strictly from Add screen fields: `title`, `content`
- Includes only essential keys: `id` (INTEGER PK AUTOINCREMENT) and `user_id` (TEXT NOT NULL)
- Single table: `digital_will_items`
- Index: `idx_digital_will_items_user_id` on `user_id`
- No extra fields (no categories, attachments, flags, timestamps)

Summary:
- Added `Digital_Will_Module_Database_Schema_MINIMAL.md` under `db-schema-design-new`, defining `digital_will_items(id, user_id, title, content)` with a `user_id` index. Aligned with your “no unnecessary fields” and local SQLite CRUD guide.

---

**User**

Update the @Digital_Will_Module_Database_Schema_MINIMAL.md to include the timestamp for when the item was created, and last updated.

---

**Cursor**

Planning to update the schema markdown to add `created_at` and `updated_at` columns, reflect them in the table and DDL, and adjust the notes to indicate timestamps are included. Proceeding to edit the file.

```markdown
# Digital Will Module — Minimal SQLite Database Schema

## Overview
This minimal schema is derived strictly from the inputs present on `src/screens/digitalWill/AddDigitalWillItemScreen.tsx`.

User-entered fields on that screen:
- `title`
- `content`

Per local data principles, we also include `id` and `user_id` (to isolate data per user). No additional fields are added.

## Tables

### 1) digital_will_items
Stores each Digital Will item created via the Add screen.

| Column   | Type     | Constraints                 | Description                  |
|----------|----------|-----------------------------|------------------------------|
| id       | INTEGER  | PRIMARY KEY AUTOINCREMENT   | Local row identifier         |
| user_id  | TEXT     | NOT NULL                    | Current signed-in user id    |
| title    | TEXT     | NOT NULL                    | Will item title              |
| content  | TEXT     | NOT NULL                    | Will item content/instructions |
| created_at | TEXT   | NOT NULL                    | ISO 8601 creation timestamp  |
| updated_at | TEXT   | NOT NULL                    | ISO 8601 last update timestamp |

## Indexes
- `CREATE INDEX` on `user_id` for quick filtering per user.

## SQLite DDL
```sql
CREATE TABLE IF NOT EXISTS digital_will_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_digital_will_items_user_id
  ON digital_will_items(user_id);
```

## Notes
- This schema is intentionally minimal and aligned only to the current Add screen fields. It does not include categories, attachments, or flags.
- `created_at` and `updated_at` are stored as ISO 8601 text; app code should update `updated_at` on edits.
- `user_id` should be supplied from the authentication context when inserting records.
- Future fields/screens can be added via `ALTER TABLE ... ADD COLUMN` without disrupting existing data.



```

Status: I updated the minimal schema to add timestamps.

Changes made to `adulting-v4/context-files/db-schema-design-new/Digital_Will_Module_Database_Schema_MINIMAL.md`:
- Added `created_at` and `updated_at` columns to the table definition.
- Updated SQLite DDL to include both with ISO 8601 defaults:
  - `created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))`
  - `updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))`
- Clarified notes to mention timestamp handling and that `updated_at` should be refreshed on edits.

Summary:
- The Digital Will minimal schema now captures creation and last update timestamps while remaining minimal and aligned to current fields.

---

**User**

Lets start building the SQLite !only! database.
Create the needed database tables, FK relations, and fields for me.
Dont change any of the styling or functionality. Only use @Digital_Will_Module_Database_Schema_MINIMAL.md  to create the tables/fields for the Digital Will Module. 



---

**Cursor**

I’m going to scan for an existing SQLite setup pattern in the services to mirror it, then add a new SQLite service for the Digital Will module that creates the `digital_will_items` table and index defined in the minimal schema.

I’m going to add a new SQLite service file to create the `digital_will_items` table and its index per the minimal schema. Then I’ll run a quick lint check on the new file.

```typescript
import * as SQLite from 'expo-sqlite';

export type DigitalWillItem = {
	id: number;
	userId: string;
	title: string;
	content: string;
	createdAt: string;
	updatedAt: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDbAsync(): Promise<SQLite.SQLiteDatabase> {
	if (!dbPromise) {
		dbPromise = SQLite.openDatabaseAsync('adulting.db');
	}
	return dbPromise;
}

export async function initializeDigitalWillDb(): Promise<void> {
	// Schema per Digital_Will_Module_Database_Schema_MINIMAL.md
	const db = await getDbAsync();
	await db.execAsync(`PRAGMA foreign_keys = ON;`);
	await db.execAsync(
		`CREATE TABLE IF NOT EXISTS digital_will_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT NOT NULL,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
			updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
		);`
	);
	await db.execAsync(
		`CREATE INDEX IF NOT EXISTS idx_digital_will_items_user_id ON digital_will_items(user_id);`
	);
}


```

Status: I created a new SQLite service `src/services/digitalWillDb.ts` that initializes the `digital_will_items` table and index exactly per `Digital_Will_Module_Database_Schema_MINIMAL.md`. I’m now going to run a linter check on the new file.

Status: The SQLite setup for the Digital Will module is in place using only the minimal schema.

What I added:
- `src/services/digitalWillDb.ts`
  - Creates `digital_will_items` with columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `user_id TEXT NOT NULL`, `title TEXT NOT NULL`, `content TEXT NOT NULL`, `created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))`, `updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))`.
  - Adds index `idx_digital_will_items_user_id` on `user_id`.
  - Exports `initializeDigitalWillDb()` to be called on app start.
  - Includes `DigitalWillItem` type reflecting the schema.

Lint:
- No linter issues in `src/services/digitalWillDb.ts`.

Summary:
- Implemented the database table, fields, and index per `Digital_Will_Module_Database_Schema_MINIMAL.md`. No styling or app functionality was touched. You can now call `initializeDigitalWillDb()` during app init to ensure the table exists.

---

**User**

I dont see any errors but i also dont see the digital_will-items table in my Database. 
Dont change any of the styling or functionality on any of the screens.

---

**Cursor**

I’m going to check the app entry (`App.tsx` and `index.ts`) to see if the new database initializer is being called. If not, I’ll wire up a non-UI-affecting initialization call during app start so the table gets created.

I'll wire up the database initialization by importing and calling the Digital Will DB initializer in `App.tsx`. Then I'll run a linter check to ensure no issues.

```typescriptreact
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider } from 'styled-components/native';
import RootNavigator from './src/navigation/RootNavigator';
import FontProvider from './src/components/FontProvider';
import theme from './src/styles/theme';
import { AuthProvider } from './src/context/AuthContext';
import { initializeEmergencyContactsDb, debugDumpAll, getEmergencyContacts, countEmergencyContacts, clearEmergencyContactsForUser } from './src/services/emergencyContactsDb';
import { initializeDigitalWillDb } from './src/services/digitalWillDb';

export default function App() {
  useEffect(() => {
    initializeEmergencyContactsDb().catch((e) => console.error('DB init error', e));
    initializeDigitalWillDb().catch((e) => console.error('Digital Will DB init error', e));

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

Status: The table wasn’t appearing because the Digital Will DB initializer wasn’t being called at startup. I imported and invoked it during app initialization.

Changes:
- `App.tsx`
  - Imported `initializeDigitalWillDb` from `src/services/digitalWillDb`.
  - Called `initializeDigitalWillDb()` inside the existing `useEffect`, alongside the emergency contacts init.
  - Lint clean.

What to do:
- Reload the app so the startup effect runs and creates the `digital_will_items` table in `adulting.db`.

Summary:
- Wired the Digital Will DB init into app start. On next app run, the `digital_will_items` table and its index will be created automatically.

---

**User**

 Alright, ive inspected the database and i can see the database looks correct and the data for the Digital Will itemsis empty. 
Remove the dummy data currently being displayed and instead show the empty list of items. 
Update the styling of the Empty state of @DigitalWillScreen.tsx as per @EmptyStateGuide.md  and use @Digital-WIll-Empty-Screen.png 

Ensure the CRUD functionality is implemented so that can create my own items.



---

**Cursor**

I’m going to quickly scan the Digital Will screens to wire CRUD with the new SQLite service and implement the empty state per the guide. Then I’ll add CRUD functions to the `digitalWillDb` service and update the screens to use them. Finally, I’ll add the empty-state asset reference.

I'll implement the Digital Will CRUD functions in the database service, replace dummy data with DB-driven lists and empty state in `DigitalWillScreen.tsx`, and wire `Add`, `Edit`, and `View` screens to use the SQLite service. Then I'll run a linter check on changed files.

```typescript
import * as SQLite from 'expo-sqlite';

export type DigitalWillItem = {
	id: number;
	userId: string;
	title: string;
	content: string;
	createdAt: string;
	updatedAt: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDbAsync(): Promise<SQLite.SQLiteDatabase> {
	if (!dbPromise) {
		dbPromise = SQLite.openDatabaseAsync('adulting.db');
	}
	return dbPromise;
}

export async function initializeDigitalWillDb(): Promise<void> {
	// Schema per Digital_Will_Module_Database_Schema_MINIMAL.md
	const db = await getDbAsync();
	await db.execAsync(`PRAGMA foreign_keys = ON;`);
	await db.execAsync(
		`CREATE TABLE IF NOT EXISTS digital_will_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT NOT NULL,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
			updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
		);`
	);
	await db.execAsync(
		`CREATE INDEX IF NOT EXISTS idx_digital_will_items_user_id ON digital_will_items(user_id);`
	);
}

export async function insertDigitalWillItem(params: {
	userId: string;
	title: string;
	content: string;
}): Promise<DigitalWillItem> {
	const db = await getDbAsync();
	const result = await db.runAsync(
		`INSERT INTO digital_will_items (user_id, title, content) VALUES (?, ?, ?);`,
		[params.userId, params.title, params.content]
	);
	// @ts-ignore - expo-sqlite returns lastInsertRowId
	const id: number = (result as any)?.lastInsertRowId;
	const row = await db.getFirstAsync<{
		id: number;
		userId: string;
		title: string;
		content: string;
		createdAt: string;
		updatedAt: string;
	}>(
		`SELECT id, user_id as userId, title, content, created_at as createdAt, updated_at as updatedAt
		 FROM digital_will_items WHERE id = ?;`,
		[id]
	);
	return row as unknown as DigitalWillItem;
}

export async function getDigitalWillItems(userId: string): Promise<DigitalWillItem[]> {
	const db = await getDbAsync();
	const rows = await db.getAllAsync<{
		id: number;
		userId: string;
		title: string;
		content: string;
		createdAt: string;
		updatedAt: string;
	}>(
		`SELECT id, user_id as userId, title, content, created_at as createdAt, updated_at as updatedAt
		 FROM digital_will_items
		 WHERE user_id = ?
		 ORDER BY updated_at DESC;`,
		[userId]
	);
	return rows as unknown as DigitalWillItem[];
}

export async function getDigitalWillItemById(id: number): Promise<DigitalWillItem | null> {
	const db = await getDbAsync();
	const row = await db.getFirstAsync<{
		id: number;
		userId: string;
		title: string;
		content: string;
		createdAt: string;
		updatedAt: string;
	}>(
		`SELECT id, user_id as userId, title, content, created_at as createdAt, updated_at as updatedAt
		 FROM digital_will_items WHERE id = ?;`,
		[id]
	);
	return (row as unknown as DigitalWillItem) || null;
}

export async function updateDigitalWillItem(params: {
	id: number;
	userId: string;
	title: string;
	content: string;
}): Promise<void> {
	const db = await getDbAsync();
	await db.runAsync(
		`UPDATE digital_will_items
		 SET title = ?, content = ?, updated_at = (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
		 WHERE id = ? AND user_id = ?;`,
		[params.title, params.content, params.id, params.userId]
	);
}

export async function deleteDigitalWillItem(id: number): Promise<void> {
	const db = await getDbAsync();
	await db.runAsync(`DELETE FROM digital_will_items WHERE id = ?;`, [id]);
}



```

```typescriptreact
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DigitalWillStackParamList } from '../../navigation/DigitalWillNavigator';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../styles/styleGuide';
import { useAuth } from '../../context/AuthContext';
import { getDigitalWillItems, DigitalWillItem } from '../../services/digitalWillDb';
import { Image } from 'react-native';

type NavigationProp = NativeStackNavigationProp<DigitalWillStackParamList>;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

const DigitalWillScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [animationValues] = useState<Record<string, Animated.Value>>({});
  const [items, setItems] = useState<DigitalWillItem[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.id) return;
      const rows = await getDigitalWillItems(user.id);
      if (mounted) setItems(rows);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Initialize animation values for each item
  React.useEffect(() => {
    filteredItems.forEach(item => {
      const key = String(item.id);
      if (!animationValues[key]) {
        animationValues[key] = new Animated.Value(0);
      }
    });
  }, [filteredItems, animationValues]);

  const toggleItem = (itemId: string) => {
    const isExpanded = !!expandedItems[itemId];
    
    // Start animation
    Animated.timing(animationValues[itemId], {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    // Update state
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleViewItem = (itemId: number) => {
    navigation.navigate('ViewDigitalWillItemDetails', { itemId });
  };

  const handleEditItem = (itemId: number) => {
    navigation.navigate('EditDigitalWillItem', { itemId });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Will</Text>
        </View>
      </SafeAreaView>
      
      {/* Main Content Card */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search digital will items..."
            placeholderTextColor={colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Will Items List */}
        <View style={styles.section}>
          <View style={styles.card}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Image
                  source={require('../../assets/emptyScreenImages/Digital-WIll-Empty-Screen.png')}
                  style={styles.emptyImage}
                />
                <Text style={styles.emptyText}>
                  You have not added any Items yet, press the button below to create your first item
                </Text>
              </View>
            ) : filteredItems.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.willItem}
                  onPress={() => toggleItem(String(item.id))}
                  activeOpacity={0.8}
                >
                  <View style={styles.willContent}>
                    <MaterialIcons 
                      name="description" 
                      size={24} 
                      color={colors.text.secondary} 
                    />
                    <View style={styles.willInfo}>
                      <Text style={styles.willText}>{item.title}</Text>
                      <Text style={styles.willMeta}>Last Updated: {formatDate(item.updatedAt)}</Text>
                    </View>
                  </View>
                  <MaterialIcons 
                    name={expandedItems[String(item.id)] ? "expand-less" : "expand-more"} 
                    size={24} 
                    color={colors.text.secondary} 
                  />
                </TouchableOpacity>
                
                <Animated.View 
                  style={[
                    styles.willActionsContainer,
                    {
                      maxHeight: animationValues[String(item.id)]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 68]
                      }) || 0,
                      opacity: animationValues[String(item.id)] || 0,
                      overflow: 'hidden'
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewItem(item.id)}
                  >
                    <MaterialIcons name="visibility" size={20} color={colors.text.white} />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditItem(item.id)}
                  >
                    <MaterialIcons name="edit" size={20} color={colors.text.white} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                </Animated.View>
                
                {index < filteredItems.length - 1 && (
                  <View style={styles.separator} />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Item Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddDigitalWillItem')}
      >
        <MaterialIcons 
          name="add" 
          size={24} 
          color={colors.text.white}
          style={components.bottomActionButton.icon}
        />
        <Text style={components.bottomActionButton.text}>
          Add New Item
        </Text>
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
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
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
  section: {
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.background.light,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#333333',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  willItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  willContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  willInfo: {
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  willText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xlx,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  willMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    opacity: 0.7,
  },
  willActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.light,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  separator: {
    height: 1,
    backgroundColor: '#333333',
    opacity: 0.2,
    marginHorizontal: spacing.md,
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
  actionButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    marginLeft: spacing.xs,
  },
  addButton: {
    ...components.bottomActionButton.container,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyImage: {
    width: 220,
    height: 220,
    marginBottom: spacing.lg,
    resizeMode: 'contain',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default DigitalWillScreen;
```

```typescriptreact
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DigitalWillStackParamList } from '../../navigation/DigitalWillNavigator';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../styles/styleGuide';
import { useAuth } from '../../context/AuthContext';
import { insertDigitalWillItem } from '../../services/digitalWillDb';

type NavigationProp = NativeStackNavigationProp<DigitalWillStackParamList>;

const AddDigitalWillItemScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = async () => {
    // Validate required fields
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content or instructions');
      return;
    }

    try {
      await insertDigitalWillItem({ userId: user?.id || 'anonymous', title: title.trim(), content: content.trim() });
      Alert.alert(
        'Success',
        'Digital will item saved successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save item');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Digital Will Item</Text>
        </View>
      </SafeAreaView>
      
      {/* Main Content Card */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
            placeholderTextColor={colors.text.placeholder}
          />
        </View>

        {/* Content/Instructions */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Content/Instructions</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            value={content}
            onChangeText={setContent}
            placeholder="Add your instructions or content here"
            placeholderTextColor={colors.text.placeholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <MaterialIcons 
            name="save" 
            size={24} 
            color={colors.text.white} 
            style={components.bottomActionButton.icon} 
          />
          <Text style={components.bottomActionButton.text}>Save Item</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
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
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  contentInput: {
    height: 300,
    paddingTop: spacing.md,
  },
  saveButton: {
    ...components.bottomActionButton.container,
    backgroundColor: colors.button.primary,
  },
});

export default AddDigitalWillItemScreen;
```

```typescriptreact
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DigitalWillStackParamList } from '../../navigation/DigitalWillNavigator';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../styles/styleGuide';
import { useAuth } from '../../context/AuthContext';
import { getDigitalWillItemById, updateDigitalWillItem, deleteDigitalWillItem } from '../../services/digitalWillDb';

type NavigationProp = NativeStackNavigationProp<DigitalWillStackParamList, 'EditDigitalWillItem'>;
type RoutePropType = RouteProp<DigitalWillStackParamList, 'EditDigitalWillItem'>;

const EditDigitalWillItemScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { itemId } = route.params;
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const row = await getDigitalWillItemById(Number(itemId));
      if (mounted && row) {
        setTitle(row.title);
        setContent(row.content);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [itemId]);

  const handleSave = async () => {
    // Validate required fields
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content or instructions');
      return;
    }

    try {
      await updateDigitalWillItem({ id: Number(itemId), userId: user?.id || 'anonymous', title: title.trim(), content: content.trim() });
      Alert.alert(
        'Success',
        'Digital will item updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Digital Will Item',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDigitalWillItem(Number(itemId));
              navigation.goBack();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Digital Will Item</Text>
        </View>
      </SafeAreaView>
      
      {/* Main Content Card */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
            placeholderTextColor={colors.text.placeholder}
          />
        </View>

        {/* Content/Instructions */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Content/Instructions</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            value={content}
            onChangeText={setContent}
            placeholder="Add your instructions or content here"
            placeholderTextColor={colors.text.placeholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
          >
            <MaterialIcons 
              name="save" 
              size={24} 
              color={colors.text.white}
              style={components.bottomActionButton.icon}
            />
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <MaterialIcons 
              name="delete" 
              size={24} 
              color={colors.text.white}
              style={components.bottomActionButton.icon}
            />
            <Text style={styles.buttonText}>Delete Item</Text>
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
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
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
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  contentInput: {
    height: 300,
    paddingTop: spacing.md,
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

export default EditDigitalWillItemScreen;
```

```typescriptreact
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DigitalWillStackParamList } from '../../navigation/DigitalWillNavigator';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../styles/styleGuide';
import { getDigitalWillItemById } from '../../services/digitalWillDb';

type NavigationProp = NativeStackNavigationProp<DigitalWillStackParamList, 'ViewDigitalWillItemDetails'>;
type RoutePropType = RouteProp<DigitalWillStackParamList, 'ViewDigitalWillItemDetails'>;

const ViewDigitalWillItemDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { itemId } = route.params;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const row = await getDigitalWillItemById(Number(itemId));
      if (mounted && row) {
        setTitle(row.title);
        setContent(row.content);
        setCreatedAt(row.createdAt);
        setUpdatedAt(row.updatedAt);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [itemId]);

  const handleEdit = () => {
    navigation.navigate('EditDigitalWillItem', { itemId });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Will Item</Text>
        </View>
      </SafeAreaView>
      
      {/* Main Content Card */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Item Details */}
        <View style={styles.detailsContainer}>
          <DetailRow label="Created" value={createdAt ? new Date(createdAt).toLocaleDateString() : ''} />
          <DetailRow label="Last Updated" value={updatedAt ? new Date(updatedAt).toLocaleDateString() : ''} />
          
          <View style={styles.contentContainer}>
            <Text style={styles.contentLabel}>Content/Instructions</Text>
            <Text style={styles.contentText}>{content}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleEdit}
          >
            <MaterialIcons name="edit" size={24} color={colors.text.white} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Helper component for detail rows
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
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
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  detailsContainer: {
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  detailValue: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  contentContainer: {
    marginTop: spacing.lg,
  },
  contentLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  contentText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xxl,
    ...shadows.sm,
  },
  primaryButton: {
    backgroundColor: colors.button.primary,
  },
  actionButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    marginLeft: spacing.sm,
  },
});

export default ViewDigitalWillItemDetailsScreen;
```

```typescriptreact
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import DigitalWillScreen from '../screens/digitalWill/DigitalWillScreen';
import AddDigitalWillItemScreen from '../screens/digitalWill/AddDigitalWillItemScreen';
import EditDigitalWillItemScreen from '../screens/digitalWill/EditDigitalWillItemScreen';
import ViewDigitalWillItemDetailsScreen from '../screens/digitalWill/ViewDigitalWillItemDetailsScreen';

// Define the navigation param list types
export type DigitalWillStackParamList = {
  DigitalWill: undefined;
  AddDigitalWillItem: undefined;
  EditDigitalWillItem: { itemId: number };
  ViewDigitalWillItemDetails: { itemId: number };
};

const Stack = createNativeStackNavigator<DigitalWillStackParamList>();

const DigitalWillNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DigitalWill" component={DigitalWillScreen} />
      <Stack.Screen name="AddDigitalWillItem" component={AddDigitalWillItemScreen} />
      <Stack.Screen name="EditDigitalWillItem" component={EditDigitalWillItemScreen} />
      <Stack.Screen name="ViewDigitalWillItemDetails" component={ViewDigitalWillItemDetailsScreen} />
    </Stack.Navigator>
  );
};

export default DigitalWillNavigator;
```

```typescriptreact
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import DigitalWillScreen from '../screens/digitalWill/DigitalWillScreen';
import AddDigitalWillItemScreen from '../screens/digitalWill/AddDigitalWillItemScreen';
import EditDigitalWillItemScreen from '../screens/digitalWill/EditDigitalWillItemScreen';
import ViewDigitalWillItemDetailsScreen from '../screens/digitalWill/ViewDigitalWillItemDetailsScreen';

// Define the navigation param list types
export type DigitalWillStackParamList = {
  DigitalWill: undefined;
  AddDigitalWillItem: undefined;
  EditDigitalWillItem: { itemId: string };
  ViewDigitalWillItemDetails: { itemId: string };
};

const Stack = createNativeStackNavigator<DigitalWillStackParamList>();

const DigitalWillNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DigitalWill" component={DigitalWillScreen} />
      <Stack.Screen name="AddDigitalWillItem" component={AddDigitalWillItemScreen} />
      <Stack.Screen name="EditDigitalWillItem" component={EditDigitalWillItemScreen} />
      <Stack.Screen name="ViewDigitalWillItemDetails" component={ViewDigitalWillItemDetailsScreen} />
    </Stack.Navigator>
  );
};

export default DigitalWillNavigator;
```

```typescriptreact
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DigitalWillStackParamList } from '../../navigation/DigitalWillNavigator';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../styles/styleGuide';
import { useAuth } from '../../context/AuthContext';
import { getDigitalWillItems, DigitalWillItem } from '../../services/digitalWillDb';
import { Image } from 'react-native';

type NavigationProp = NativeStackNavigationProp<DigitalWillStackParamList>;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

const DigitalWillScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [animationValues] = useState<Record<string, Animated.Value>>({});
  const [items, setItems] = useState<DigitalWillItem[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.id) return;
      const rows = await getDigitalWillItems(user.id);
      if (mounted) setItems(rows);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const load = async () => {
        if (!user?.id) return;
        const rows = await getDigitalWillItems(user.id);
        if (isActive) setItems(rows);
      };
      load();
      return () => {
        isActive = false;
      };
    }, [user?.id])
  );

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Initialize animation values for each item
  React.useEffect(() => {
    filteredItems.forEach(item => {
      const key = String(item.id);
      if (!animationValues[key]) {
        animationValues[key] = new Animated.Value(0);
      }
    });
  }, [filteredItems, animationValues]);

  const toggleItem = (itemId: string) => {
    const isExpanded = !!expandedItems[itemId];
    
    // Start animation
    Animated.timing(animationValues[itemId], {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    // Update state
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleViewItem = (itemId: string) => {
    navigation.navigate('ViewDigitalWillItemDetails', { itemId });
  };

  const handleEditItem = (itemId: string) => {
    navigation.navigate('EditDigitalWillItem', { itemId });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Will</Text>
        </View>
      </SafeAreaView>
      
      {/* Main Content Card */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search digital will items..."
            placeholderTextColor={colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Will Items List */}
        <View style={styles.section}>
          <View style={styles.card}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Image
                  source={require('../../assets/emptyScreenImages/Digital-WIll-Empty-Screen.png')}
                  style={styles.emptyImage}
                />
                <Text style={styles.emptyText}>
                  You have not added any Items yet, press the button below to create your first item
                </Text>
              </View>
            ) : filteredItems.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.willItem}
                  onPress={() => toggleItem(String(item.id))}
                  activeOpacity={0.8}
                >
                  <View style={styles.willContent}>
                    <MaterialIcons 
                      name="description" 
                      size={24} 
                      color={colors.text.secondary} 
                    />
                    <View style={styles.willInfo}>
                      <Text style={styles.willText}>{item.title}</Text>
                      <Text style={styles.willMeta}>Last Updated: {formatDate(item.updatedAt)}</Text>
                    </View>
                  </View>
                  <MaterialIcons 
                    name={expandedItems[String(item.id)] ? "expand-less" : "expand-more"} 
                    size={24} 
                    color={colors.text.secondary} 
                  />
                </TouchableOpacity>
                
                <Animated.View 
                  style={[
                    styles.willActionsContainer,
                    {
                      maxHeight: animationValues[String(item.id)]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 68]
                      }) || 0,
                      opacity: animationValues[String(item.id)] || 0,
                      overflow: 'hidden'
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewItem(String(item.id))}
                  >
                    <MaterialIcons name="visibility" size={20} color={colors.text.white} />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditItem(String(item.id))}
                  >
                    <MaterialIcons name="edit" size={20} color={colors.text.white} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                </Animated.View>
                
                {index < filteredItems.length - 1 && (
                  <View style={styles.separator} />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Item Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddDigitalWillItem')}
      >
        <MaterialIcons 
          name="add" 
          size={24} 
          color={colors.text.white}
          style={components.bottomActionButton.icon}
        />
        <Text style={components.bottomActionButton.text}>
          Add New Item
        </Text>
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
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
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
  section: {
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.background.light,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#333333',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  willItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  willContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  willInfo: {
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  willText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xlx,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  willMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    opacity: 0.7,
  },
  willActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.light,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  separator: {
    height: 1,
    backgroundColor: '#333333',
    opacity: 0.2,
    marginHorizontal: spacing.md,
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
  actionButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    marginLeft: spacing.xs,
  },
  addButton: {
    ...components.bottomActionButton.container,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyImage: {
    width: 220,
    height: 220,
    marginBottom: spacing.lg,
    resizeMode: 'contain',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default DigitalWillScreen;
```

```typescriptreact
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DigitalWillStackParamList } from '../../navigation/DigitalWillNavigator';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../styles/styleGuide';
import { useAuth } from '../../context/AuthContext';
import { getDigitalWillItemById, updateDigitalWillItem, deleteDigitalWillItem } from '../../services/digitalWillDb';

type NavigationProp = NativeStackNavigationProp<DigitalWillStackParamList, 'EditDigitalWillItem'>;
type RoutePropType = RouteProp<DigitalWillStackParamList, 'EditDigitalWillItem'>;

const EditDigitalWillItemScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { itemId } = route.params;
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const row = await getDigitalWillItemById(Number(itemId));
      if (mounted && row) {
        setTitle(row.title);
        setContent(row.content);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [itemId]);

  const handleSave = async () => {
    // Validate required fields
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content or instructions');
      return;
    }

    try {
      await updateDigitalWillItem({ id: Number(itemId), userId: user?.id || 'anonymous', title: title.trim(), content: content.trim() });
      Alert.alert(
        'Success',
        'Digital will item updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Digital Will Item',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDigitalWillItem(Number(itemId));
              navigation.goBack();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Digital Will Item</Text>
        </View>
      </SafeAreaView>
      
      {/* Main Content Card */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
            placeholderTextColor={colors.text.placeholder}
          />
        </View>

        {/* Content/Instructions */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Content/Instructions</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            value={content}
            onChangeText={setContent}
            placeholder="Add your instructions or content here"
            placeholderTextColor={colors.text.placeholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
          >
            <MaterialIcons 
              name="save" 
              size={24} 
              color={colors.text.white}
              style={components.bottomActionButton.icon}
            />
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <MaterialIcons 
              name="delete" 
              size={24} 
              color={colors.text.white}
              style={components.bottomActionButton.icon}
            />
            <Text style={styles.buttonText}>Delete Item</Text>
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
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
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
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  contentInput: {
    height: 300,
    paddingTop: spacing.md,
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

export default EditDigitalWillItemScreen;
```

```typescriptreact
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DigitalWillStackParamList } from '../../navigation/DigitalWillNavigator';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../styles/styleGuide';
import { getDigitalWillItemById } from '../../services/digitalWillDb';

type NavigationProp = NativeStackNavigationProp<DigitalWillStackParamList, 'ViewDigitalWillItemDetails'>;
type RoutePropType = RouteProp<DigitalWillStackParamList, 'ViewDigitalWillItemDetails'>;

const ViewDigitalWillItemDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { itemId } = route.params;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const row = await getDigitalWillItemById(Number(itemId));
      if (mounted && row) {
        setTitle(row.title);
        setContent(row.content);
        setCreatedAt(row.createdAt);
        setUpdatedAt(row.updatedAt);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [itemId]);

  const handleEdit = () => {
    navigation.navigate('EditDigitalWillItem', { itemId });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Will Item</Text>
        </View>
      </SafeAreaView>
      
      {/* Main Content Card */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Item Details */}
        <View style={styles.detailsContainer}>
          <DetailRow label="Created" value={createdAt ? new Date(createdAt).toLocaleDateString() : ''} />
          <DetailRow label="Last Updated" value={updatedAt ? new Date(updatedAt).toLocaleDateString() : ''} />
          
          <View style={styles.contentContainer}>
            <Text style={styles.contentLabel}>Content/Instructions</Text>
            <Text style={styles.contentText}>{content}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleEdit}
          >
            <MaterialIcons name="edit" size={24} color={colors.text.white} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Helper component for detail rows
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
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
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  detailsContainer: {
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  detailValue: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  contentContainer: {
    marginTop: spacing.lg,
  },
  contentLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  contentText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xxl,
    ...shadows.sm,
  },
  primaryButton: {
    backgroundColor: colors.button.primary,
  },
  actionButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    marginLeft: spacing.sm,
  },
});

export default ViewDigitalWillItemDetailsScreen;
```

Status: I removed dummy data, implemented SQLite CRUD for Digital Will, added the empty state per the guide, and wired everything to your existing navigation and auth without changing styling beyond the empty-state block.

What I changed
- Database service `src/services/digitalWillDb.ts`
  - Added CRUD:
    - `insertDigitalWillItem({ userId, title, content })`
    - `getDigitalWillItems(userId)`
    - `getDigitalWillItemById(id)`
    - `updateDigitalWillItem({ id, userId, title, content })`
    - `deleteDigitalWillItem(id)`
- Digital Will list `src/screens/digitalWill/DigitalWillScreen.tsx`
  - Removed hardcoded dummy data.
  - Loads items from SQLite using `useAuth().user.id`.
  - Added refresh on screen focus to reflect new/edited/deleted items.
  - Implemented Empty State per `EmptyStateGuide.md` and using `../../assets/emptyScreenImages/Digital-WIll-Empty-Screen.png`.
  - Maintained existing styling/UX; only added the empty-state styles/JSX.
- Add screen `src/screens/digitalWill/AddDigitalWillItemScreen.tsx`
  - Hooked up save to `insertDigitalWillItem`.
- Edit screen `src/screens/digitalWill/EditDigitalWillItemScreen.tsx`
  - Loads item by `itemId`.
  - Save updates via `updateDigitalWillItem`.
  - Delete removes via `deleteDigitalWillItem`.
- View details `src/screens/digitalWill/ViewDigitalWillItemDetailsScreen.tsx`
  - Loads and displays item from DB.
- Navigator `src/navigation/DigitalWillNavigator.tsx`
  - Param types aligned (string ids passed via nav; converted to number in screens).

Next steps to test
- Ensure the empty-state asset exists at:
  - `src/assets/emptyScreenImages/Digital-WIll-Empty-Screen.png`
- Reload the app.
- Digital Will screen should show the empty state.
- Tap “Add New Item”, save a new item; you should be navigated back and see the list populated.
- Edit and Delete actions should work and reflect in the list.

Summary:
- Dummy data removed; list now reads from SQLite.
- Empty state implemented using `Digital-WIll-Empty-Screen.png` per the guide.
- Full CRUD added for Digital Will items with no UI styling changes beyond the prescribed empty state.

---

**User**

When there are no Digital WIll items created, the new Empty State message and image is showing correctly, only its displaying in the card with border and drop shadow. It should not display in a card. 
Fix this UI styling issue.
Dont change any other styling or functionality.

---

**Cursor**

I'll update `src/screens/digitalWill/DigitalWillScreen.tsx` so the empty state renders outside the card container. This will remove the border/shadow around the empty state without affecting other styles. Then I'll run a quick lint check on the modified file.

```typescriptreact
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DigitalWillStackParamList } from '../../navigation/DigitalWillNavigator';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../styles/styleGuide';
import { useAuth } from '../../context/AuthContext';
import { getDigitalWillItems, DigitalWillItem } from '../../services/digitalWillDb';
import { Image } from 'react-native';

type NavigationProp = NativeStackNavigationProp<DigitalWillStackParamList>;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

const DigitalWillScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [animationValues] = useState<Record<string, Animated.Value>>({});
  const [items, setItems] = useState<DigitalWillItem[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.id) return;
      const rows = await getDigitalWillItems(user.id);
      if (mounted) setItems(rows);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const load = async () => {
        if (!user?.id) return;
        const rows = await getDigitalWillItems(user.id);
        if (isActive) setItems(rows);
      };
      load();
      return () => {
        isActive = false;
      };
    }, [user?.id])
  );

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Initialize animation values for each item
  React.useEffect(() => {
    filteredItems.forEach(item => {
      const key = String(item.id);
      if (!animationValues[key]) {
        animationValues[key] = new Animated.Value(0);
      }
    });
  }, [filteredItems, animationValues]);

  const toggleItem = (itemId: string) => {
    const isExpanded = !!expandedItems[itemId];
    
    // Start animation
    Animated.timing(animationValues[itemId], {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    // Update state
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleViewItem = (itemId: string) => {
    navigation.navigate('ViewDigitalWillItemDetails', { itemId });
  };

  const handleEditItem = (itemId: string) => {
    navigation.navigate('EditDigitalWillItem', { itemId });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Dark Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Will</Text>
        </View>
      </SafeAreaView>
      
      {/* Main Content Card */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search digital will items..."
            placeholderTextColor={colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Will Items List */}
        <View style={styles.section}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Image
                source={require('../../assets/emptyScreenImages/Digital-WIll-Empty-Screen.png')}
                style={styles.emptyImage}
              />
              <Text style={styles.emptyText}>
                You have not added any Digital Will Items yet, press the button below to create your first item
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {filteredItems.map((item, index) => (
                <View key={item.id}>
                  <TouchableOpacity
                    style={styles.willItem}
                    onPress={() => toggleItem(String(item.id))}
                    activeOpacity={0.8}
                  >
                    <View style={styles.willContent}>
                      <MaterialIcons 
                        name="description" 
                        size={24} 
                        color={colors.text.secondary} 
                      />
                      <View style={styles.willInfo}>
                        <Text style={styles.willText}>{item.title}</Text>
                        <Text style={styles.willMeta}>Last Updated: {formatDate(item.updatedAt)}</Text>
                      </View>
                    </View>
                    <MaterialIcons 
                      name={expandedItems[String(item.id)] ? "expand-less" : "expand-more"} 
                      size={24} 
                      color={colors.text.secondary} 
                    />
                  </TouchableOpacity>
                  
                  <Animated.View 
                    style={[
                      styles.willActionsContainer,
                      {
                        maxHeight: animationValues[String(item.id)]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 68]
                        }) || 0,
                        opacity: animationValues[String(item.id)] || 0,
                        overflow: 'hidden'
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleViewItem(String(item.id))}
                    >
                      <MaterialIcons name="visibility" size={20} color={colors.text.white} />
                      <Text style={styles.actionButtonText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditItem(String(item.id))}
                    >
                      <MaterialIcons name="edit" size={20} color={colors.text.white} />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </Animated.View>
                  
                  {index < filteredItems.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Item Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddDigitalWillItem')}
      >
        <MaterialIcons 
          name="add" 
          size={24} 
          color={colors.text.white}
          style={components.bottomActionButton.icon}
        />
        <Text style={components.bottomActionButton.text}>
          Add New Item
        </Text>
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
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxxl,
    color: colors.text.white,
    textAlign: 'left',
    marginLeft: spacing.md,
    alignSelf: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
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
  section: {
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.background.light,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#333333',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  willItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  willContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  willInfo: {
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  willText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xlx,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  willMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    opacity: 0.7,
  },
  willActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.light,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  separator: {
    height: 1,
    backgroundColor: '#333333',
    opacity: 0.2,
    marginHorizontal: spacing.md,
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
  actionButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    marginLeft: spacing.xs,
  },
  addButton: {
    ...components.bottomActionButton.container,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyImage: {
    width: 220,
    height: 220,
    marginBottom: spacing.lg,
    resizeMode: 'contain',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default DigitalWillScreen;
```

Status: I adjusted `DigitalWillScreen.tsx` so the empty state renders outside the card container. This removes the border and shadow around the empty-state message and image without touching any other styling or functionality.

What changed
- `src/screens/digitalWill/DigitalWillScreen.tsx`
  - Moved the empty-state JSX out of the `styles.card` wrapper. The card is now only used when there are items to list.
  - No changes to existing styles other than using the already-added `emptyStateContainer`, `emptyImage`, and `emptyText` styles.

Summary:
- Empty state now displays standalone (no card border/shadow). Everything else remains unchanged.

---

**User**

Update the @EmptyStateGuide.md with the needed information to ensure all other Empty State screen styling implementations on other screens also adheres to not having the image and text components be inside a the card component.
Dont change any other styling, nagivation or functionality. Just update the Guide.

---

**Cursor**

```markdown
### Empty State Pattern Guide

This guide documents the exact empty-state layout and styling used on `MyDocumentsScreen.tsx` and `EmergencyContactsScreen.tsx` so you can replicate it consistently on other screens.

## When to show the empty state
- **Condition**: Show the empty state when the current list to render is empty.
  - If your screen supports search or filters, use the filtered collection length (e.g., `filtered.length === 0`).
  - If your screen groups items, show the empty state when the ungrouped items array is empty (e.g., `filteredDocuments.length === 0`).

## Asset location and naming
- Place artwork in `src/assets/emptyScreenImages/`.
- Use a descriptive name per module, e.g., `YourModule-EmptyPage-Icon.png`.
- Recommended display size: `220x220`, `resizeMode: 'contain'`.

## Imports required
- Ensure your screen imports these (most screens already do):
  - `Image` from `react-native`
  - `colors`, `typography`, `spacing` from `../../styles/styleGuide`

```tsx
import { Image } from 'react-native';
import { colors, typography, spacing } from '../../styles/styleGuide';
```

## JSX pattern
Place the conditional block inside the existing scroll content area where the list normally renders. Do not remove or alter the existing layout; only wrap the list rendering with the empty-state conditional.

Important: The empty-state container must NOT be placed inside any card wrapper (e.g., a `View` using `styles.card` that applies borders, shadows, or rounded corners). Render the empty state at the same level where the card would be, and only render the card when there are list items.

```tsx
{filtered.length === 0 ? (
  // Render the empty state OUTSIDE of the card component
  <View style={styles.emptyStateContainer}>
    <Image
      source={require('../../assets/emptyScreenImages/YourModule-EmptyPage-Icon.png')}
      style={styles.emptyImage}
    />
    <Text style={styles.emptyText}>
      You have not added any Items yet, press the button below to create your first item
    </Text>
  </View>
) : (
  // Only wrap the actual list items in the card when there is data
  <View style={styles.card}>
    {/* Existing list rendering goes here */}
  </View>
)}
```

Notes:
- Adjust the `require` path relative to the screen file location (e.g., `../../assets/...`).
- Replace the message noun (e.g., Documents, Emergency Contacts) to match the screen.
- Keep the message referencing the existing bottom action button; do not add new buttons.

## Style additions (exact values)
Add these to the screen's `StyleSheet.create({ ... })`. Keep all existing styles unchanged.

```tsx
emptyStateContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
},
emptyImage: {
  width: 220,
  height: 220,
  marginBottom: spacing.lg,
  resizeMode: 'contain',
},
emptyText: {
  fontFamily: typography.fontFamily.regular,
  fontSize: typography.fontSize.lg,
  color: colors.text.secondary,
  textAlign: 'center',
  opacity: 0.8,
},
```

## Message templates
- Documents: "You have not added any Documents yet, press the button below to create your first item"
- Emergency Contacts: "You have not added any Emergency Contacts yet, press the button below to create your first item"
- Generic: "You have not added any Items yet, press the button below to create your first item"

## Placement checklist
- The conditional block is rendered inside the main content `ScrollView` container.
- The empty state is NOT wrapped in any card container that adds borders/shadows.
- The card wrapper is used only when rendering a non-empty list of items.
- No changes to navigation, headers, action buttons, or other styling.
- The bottom action button remains the primary way to add the first item.

## Quick steps
- Add `Image` import.
- Add the three styles above.
- Wrap the list rendering with the conditional JSX shown.
- Point the `require` to the correct image in `src/assets/emptyScreenImages`.



```

Status: I updated the guide so all modules implement empty states outside of card wrappers.

Changes:
- `src/docs/EmptyStateGuide.md`
  - Added explicit instruction: do not place empty-state content inside a card component.
  - Updated JSX example to render the empty state outside the card and only use the card when there are items.
  - Updated placement checklist to include these rules.

Summary:
- Guide now clearly enforces that empty-state image/text must not appear inside bordered/shadowed cards, preventing the styling issue across modules.

