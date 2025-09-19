# AGENTS.md - Repository Instructions for Autonomous Coding Agents

## Project Type
Next.js + Supabase monorepo

## Build Commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Test: `pnpm test`
- Typecheck: `pnpm typecheck`

## Supabase Commands
- Reset DB: `supabase db reset`
- Create migration: `supabase migration new <name>`
- Check status: `supabase status`

## Commit Format
Use conventional commits: `feat(scope): description`

## Migration Rules
- Always use `IF NOT EXISTS` for CREATE statements
- Include RLS policies for user data tables
- Add comments for new tables/columns
- Test migrations with `supabase db reset`

## Code Style
- Use TypeScript for all new files
- Follow existing patterns in the codebase
- Add tests for new functionality
- Update documentation for public APIs

## Safety Rules
- Never edit .env files
- Keep changes small (< 500 lines per PR)
- Run tests after code changes
- Create atomic commits with clear messages
