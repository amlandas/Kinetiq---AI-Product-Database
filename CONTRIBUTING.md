# Contributing to Kinetiq

Thank you for your interest in contributing to Kinetiq! We want to make it as easy as possible for you to get started.

## How to Contribute

### Reporting Bugs
If you find a bug, please create a new issue on GitHub. include:
*   A descriptive title.
*   Steps to reproduce the issue.
*   Expected vs. actual behavior.
*   Screenshots if possible.

### Suggesting Features
We love new ideas! Please open a GitHub issue to discuss your feature request before writing code.

### Submitting Pull Requests
1.  **Fork** the repository and clone it locally.
2.  Create a new branch: `git checkout -b feature/my-amazing-feature`.
3.  Make your changes and test thoroughly.
4.  Commit your changes: `git commit -m "feat: add amazing feature"`.
5.  Push to your fork: `git push origin feature/my-amazing-feature`.
6.  Open a **Pull Request** on the main repository.

## Development Guidelines

### Code Style
*   We use **TypeScript** for type safety. Please ensure no `any` types unless absolutely necessary.
*   Styling is handled via **Tailwind CSS**. Avoid custom CSS files where possible.
*   Main components live in `/components`.
*   Data services live in `/services`.

### Testing
*   Before submitting, ensure the app runs locally without errors (`npm run dev`).
*   Verify that `npm run build` succeeds.

## License
By contributing, you agree that your contributions will be licensed under its MIT License.
