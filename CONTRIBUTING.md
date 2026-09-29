# Contributing to Rank Flys

Thank you for your interest in contributing to **Rank Flys**.

Rank Flys is an open-source EdTech project focused on helping students prepare for competitive examinations such as **NEET** and **JEE**.

We welcome contributions that improve the quality, accessibility, reliability, performance, security, documentation, and educational experience of the project.

## Ways to Contribute

There are many ways you can contribute to Rank Flys:

* Reporting bugs
* Fixing bugs
* Suggesting new features
* Improving documentation
* Improving UI/UX
* Improving application performance
* Improving accessibility
* Adding or improving tests
* Improving developer experience
* Reviewing pull requests
* Improving code quality
* Helping improve the project's development process

## Before You Start

Before making a major change, please open a GitHub Issue to discuss the proposed change with the maintainers.

For small changes such as documentation improvements, typo fixes, or minor bug fixes, you may submit a pull request directly.

Please check existing issues and pull requests before starting work to avoid duplicate efforts.

## Development Setup

### 1. Fork the Repository

Create your own fork of the Rank Flys repository on GitHub.

### 2. Clone the Repository

Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/Rank-Flys-App-Final-React-Native.git
```

Enter the project directory:

```bash
cd Rank-Flys-App-Final-React-Native
```

### 3. Add the Upstream Repository

Add the original Rank Flys repository as `upstream`:

```bash
git remote add upstream https://github.com/flyslearning/Rank-Flys-App-Final-React-Native.git
```

Check the configured remotes:

```bash
git remote -v
```

You should see your fork as `origin` and the Rank Flys repository as `upstream`.

### 4. Install Dependencies

Install the project's dependencies:

```bash
npm install
```

If the project uses Yarn, use:

```bash
yarn install
```

Use the package manager and commands configured by the project.

### 5. Start the Development Environment

If the project uses Expo:

```bash
npx expo start
```

For Android development, make sure Android Studio, Android SDK, and the required development environment are configured correctly.

Follow the instructions in the project's `README.md` for any additional setup requirements.

## Create a Branch

Please create a separate branch for each feature, bug fix, or improvement.

For a new feature:

```bash
git checkout -b feature/feature-name
```

For a bug fix:

```bash
git checkout -b fix/bug-name
```

For documentation:

```bash
git checkout -b docs/documentation-update
```

Use a short and descriptive branch name.

## Keep Your Branch Updated

Before starting work, make sure your local repository is up to date:

```bash
git checkout main
git pull upstream main
```

Then create your working branch:

```bash
git checkout -b feature/your-feature
```

## Making Changes

When making changes:

* Keep the code readable and maintainable.
* Follow the existing project structure.
* Follow the project's existing coding conventions.
* Avoid unnecessary changes unrelated to your contribution.
* Keep changes focused on the issue or feature being addressed.
* Update documentation when necessary.
* Test your changes before submitting a pull request.

## Educational Content

Rank Flys is an educational platform for students preparing for competitive examinations.

If your contribution includes questions, explanations, solutions, study material, images, videos, or other educational resources:

* Make sure the content is accurate.
* Make sure you have the necessary rights to submit the content.
* Do not submit copyrighted material without permission.
* Provide sources where appropriate.
* Do not include private or confidential information.
* Do not submit leaked, unauthorized, or confidential examination material.

## Commit Messages

Use clear and descriptive commit messages.

Good examples:

```text
Fix incorrect question display
Improve login validation
Add loading state to test screen
Improve exam result UI
Update contributing guidelines
Fix navigation issue
Improve accessibility labels
```

Avoid vague messages such as:

```text
update
changes
fix
test
new
```

## Testing

Before submitting a pull request:

1. Install dependencies successfully.
2. Run the application locally.
3. Test the functionality you changed.
4. Check that existing functionality still works.
5. Test on an appropriate Android environment when applicable.
6. Check for console errors and warnings where practical.

If automated tests are available, run the relevant test commands before submitting your pull request.

## Pull Requests

When your changes are ready:

1. Commit your changes.
2. Push your branch to your fork.
3. Open a Pull Request against the `main` branch of the Rank Flys repository.

Push your branch:

```bash
git push origin feature/your-feature
```

Then open a Pull Request on GitHub.

## Pull Request Description

Please provide a clear description of your changes.

Your pull request should explain:

* What was changed?
* Why was it changed?
* Which issue does it address?
* How was it tested?
* Are there any known limitations?

If your change affects the user interface, include screenshots or screen recordings when helpful.

## Pull Request Checklist

Before submitting a pull request, check:

* [ ] The code builds successfully.
* [ ] The application runs locally.
* [ ] I tested the changes.
* [ ] Existing functionality still works.
* [ ] I followed the project's coding conventions.
* [ ] I updated documentation where necessary.
* [ ] I did not include secrets or credentials.
* [ ] I did not include private user information.
* [ ] I did not include unauthorized copyrighted content.
* [ ] My commit messages are clear.
* [ ] My pull request clearly explains the changes.

## Reporting Bugs

If you discover a bug, please create a GitHub Issue.

Include:

* A clear title.
* A description of the problem.
* Steps to reproduce the issue.
* Expected behavior.
* Actual behavior.
* Device information.
* Android version, when relevant.
* Application version, when relevant.
* Screenshots or logs when helpful.

Do not include passwords, API keys, authentication tokens, personal information, or other sensitive information in public issues.

## Feature Requests

Feature requests are welcome.

When suggesting a feature, explain:

* What problem the feature would solve.
* Who would benefit from it.
* How you expect it to work.
* Any relevant examples or references.

Large changes should be discussed with the maintainers before implementation.

## Security Issues

Please do not report security vulnerabilities through public GitHub Issues.

For security-related issues, follow the instructions in [SECURITY.md](SECURITY.md).

Never commit:

* API keys
* Passwords
* Authentication tokens
* Database credentials
* Private certificates
* Signing keys
* Production secrets
* Private user information

## Code Review

All pull requests may be reviewed by project maintainers.

Reviewers may request changes related to:

* Correctness
* Security
* Performance
* Maintainability
* User experience
* Code quality
* Testing
* Documentation

Please treat code review as a collaborative process.

## Community Guidelines

All contributors are expected to follow the project's [Code of Conduct](CODE_OF_CONDUCT.md).

Please communicate respectfully and constructively with other contributors.

## License

By contributing to Rank Flys, you agree that your contributions may be included in the project under the project's [MIT License](LICENSE), subject to the applicable rights and terms.

## Questions

If you have questions about contributing, open a GitHub Issue or start a discussion if GitHub Discussions are enabled for the repository.

Thank you for helping improve **Rank Flys** and making competitive exam preparation more accessible to students.

**Happy contributing!**
