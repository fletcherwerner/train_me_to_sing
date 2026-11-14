# Project rules

## Documentation

- **One README.** The root `README.md` is the only README in this repository. Do not create a `README.md` (or any other index or how-to file that plays that role) in a subdirectory.
- The README is divided into sections by the area each addresses. Put new guidance in the section it belongs to, or add a new numbered section and list it in the table at the top.
- When pointing to guidance, cite the root README and the section, for example: `README.md`, section 5 "Agent communication rules".
- If a tool or template generates a README in a subdirectory, or overwrites the root one, remove or restore it and move anything worth keeping into the root README.
- Specifications are not READMEs and stay where they are: `planning/*.md`, `planning/epics/*.md`, `comms/templates/*.md`, and the agents' reports under `comms/`.

## Where things are

- How to run the build loop, where outputs are stored, and how the agents communicate: `README.md`.
- What to build and the rules for building it: `planning/01-architecture.md` and `planning/epics/`.
- What the owner needs from the UI: `planning/ui-requirements.md`. Only the owner edits it.
