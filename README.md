# MVP - Supply Chain Intelligence

This repository contains the Finkargo Analytics MVP - Supply Chain Intelligence Platform.

## Project Structure

The actual application code is located in the `mvp-spi` subdirectory, which is configured as a git submodule.

```
.
├── .git/              # Main repository git data
├── .gitignore         # Git ignore rules
├── .gitmodules        # Git submodule configuration
└── mvp-spi/           # Application code (submodule)
    ├── src/           # Source code
    ├── package.json   # Dependencies
    ├── tsconfig.json  # TypeScript config
    └── ...
```

## Getting Started

```bash
# Navigate to the application directory
cd mvp-spi

# Install dependencies
npm install

# Run development server
npm run dev
```

For detailed development instructions, see [mvp-spi/CLAUDE.md](mvp-spi/CLAUDE.md).