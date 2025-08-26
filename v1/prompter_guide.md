PROMPTER Analysis Engine — Minimal Pattern Extractor Guide
1. Goal

Extract repeated patterns from user prompts (from exported chat logs or markdown/text files). Output = a repository of snippets or full prompts the user often reuses.
Keep it simple, deterministic, and offline.

2. Input Handling

Accept .txt and .md files.

Each file is linked to a Topic (e.g., “Travel Assistant”, “Budget Tool”).

Multiple files can belong to the same Topic.

Parsing Rules

Identify user prompts only.

Detect using prefixes (User:, You:, etc.) or turn-based assumption (odd=User, even=Assistant).

Strip markdown formatting, code fences, blockquotes.

Preserve prompt content exactly (whitespace and punctuation kept).

3. Pattern Extraction
A. Full Prompt Deduplication

Store each unique prompt in a set.

Count frequency (used_count).

Sort by descending frequency.

B. Snippet Extraction

Break each prompt into n-grams (n=2…6 words).

Count occurrences across the dataset.

Keep only snippets that appear ≥2 times.

Example:

Prompts:

“Boost budget by 10% for department A”

“Boost budget by 20% for department B”

Extracted snippet: “boost budget by”.

C. Long Text / Block Detection

If a longer identical prompt (≥20 words) appears ≥2 times → mark as a reusable full block.

Store separately as “long-text templates”.

4. Placeholders
File Name Placeholders

Allow substitution markers in filenames, e.g.:

{project_name}_session_{date}.md


Engine resolves {project_name}, {date} when generating snippet references.

Prompt Text Placeholders

Detect variable tokens and replace with {placeholder}.

Heuristic: words/numbers that change across otherwise identical prompts.

Example:

Prompts:

“Boost budget by 10% for department A”

“Boost budget by 15% for department B”

Extracted pattern:

Boost budget by {percentage}% for department {name}

5. Repository Structure

Use JSON or SQLite. Example JSON:

{
  "topics": {
    "Budget Tool": {
      "snippets": [
        {"text": "boost budget by", "count": 23},
        {"text": "update balance sheet", "count": 12}
      ],
      "blocks": [
        {
          "text": "Boost budget by {percentage}% for department {name}",
          "count": 7
        }
      ]
    }
  }
}

6. Engine API

Expose only basic functions:

# Ingest files
ingest_file(filepath: str, topic: str) -> None

# Get common snippets
get_snippets(topic: str, min_count: int=2) -> List[str]

# Get full reusable blocks
get_blocks(topic: str, min_count: int=2) -> List[str]

# Export / Import repository
export_repo(filepath: str) -> None
import_repo(filepath: str) -> None

7. UI / Usage Notes

Minimal interface:

Topic selector.

Snippets list (short recurring strings).

Blocks list (full reusable prompts with placeholders).

Clicking a snippet/block = copies to clipboard.

8. Implementation Roadmap

Parse file → extract only user prompts.

Build frequency dictionary of full prompts.

Extract n-grams (2–6) → filter frequent ones.

Detect long repeated prompts (≥20 words).

Identify variable tokens → convert into placeholders.

Store in JSON/SQLite.

Provide retrieval API for snippets/blocks.

✅ End result: a lean analysis engine that only extracts & catalogs user’s repeated patterns into snippets or full prompt templates with placeholders.