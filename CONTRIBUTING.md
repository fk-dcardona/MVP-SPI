# Contributing to Finkargo Analytics MVP

## 🌊 Development Philosophy
We follow the "Water Philosophy" - our code and processes should flow naturally, adapt to needs, and maintain clarity.

## 🌿 Branch Strategy

We use a simplified GitHub Flow to reduce complexity and maintain a clean repository.

### Branch Naming Convention

- `feat/` - New features (e.g., `feat/navigator-analytics`)
- `fix/` - Bug fixes (e.g., `fix/csv-upload-validation`)
- `docs/` - Documentation updates (e.g., `docs/api-guide`)
- `refactor/` - Code improvements (e.g., `refactor/agent-system`)
- `test/` - Test additions (e.g., `test/onboarding-e2e`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Workflow

1. **Create Branch from Main**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature-name
   ```

2. **Keep Branches Short-Lived**
   - Maximum 3-5 days per branch
   - Break large features into smaller chunks
   - Merge frequently to avoid conflicts

3. **Commit Often with Clear Messages**
   ```bash
   git commit -m "feat: Add persona detection to dashboard"
   ```
   
   Follow conventional commits:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `refactor:` Code change that neither fixes a bug nor adds a feature
   - `test:` Adding tests
   - `chore:` Maintenance

4. **Push and Create Pull Request**
   ```bash
   git push origin feat/your-feature-name
   ```
   Then create a PR on GitHub

5. **After Merge, Delete Branch**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feat/your-feature-name
   ```

### Golden Rules

1. **Main is Sacred**: Always deployable, never commit directly
2. **One Feature, One Branch**: Keep changes focused
3. **Test Before Merge**: Run `npm run type-check` and `npm run lint`
4. **Clean Up**: Delete branches immediately after merging
5. **Document Changes**: Update CLAUDE.md for significant changes

### Code Quality Checklist

Before creating a PR, ensure:
- [ ] TypeScript compilation passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass (if applicable): `npm run test`
- [ ] Documentation updated if needed
- [ ] No console.log statements (unless intentional)

### Persona-Driven Development

When developing features, consider our 5 user personas:
- 🏃 **Streamliners** (34%): Speed and efficiency
- 🧭 **Navigators** (28%): Control and analysis
- 🌐 **Hubs** (12%): Multi-entity coordination
- 🌱 **Springs** (18%): Learning and growth
- 🏭 **Processors** (8%): Reliability and system health

### Getting Help

- Check `/docs/CLAUDE.md` for codebase guidance
- Review `/docs/User_Personas` for user context
- Look at existing patterns in the codebase
- Ask questions in PR comments

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Push to your fork
6. Create a Pull Request

Remember: Keep it simple, keep it clean, keep it flowing! 🌊