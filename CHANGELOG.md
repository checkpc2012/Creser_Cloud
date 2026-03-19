# Changelog - Proyecto Creser

## [1.0.0] - 2026-03-18
### Added
- New clean project baseline bootstrap (V1.0.0).
- Standardized project structure and environment templates.
- Strict exclusion of backup clutter and build artifacts.
- Intentionally omitted .git history for a fresh start.

## [1.2.1] - 2026-03-16
### Added
- Rigorous server-side validation for loan creation and refinancing.
- Loading states and visual polish in financial modals.
- Enhanced error messaging for unauthorized role actions.

### Fixed
- Potential edge cases in principal amount validation.
- Minor layout inconsistencies in the installment projection table.

## [1.2.0] - 2026-03-16
### Added
- Advanced Credit Engine (`credit-engine.ts`) with support for French and Direct amortization systems.
- Robust rounding and principal reconciliation logic.
- Calculation parameter snapshots for auditability.
- Pre-calculation simulation table in Refinance and New Loan modals.

### Fixed
- Issues with zero-value interests and taxes in new refinancings (V1.1.0 legacy).
- Inconsistencies in total principal amortization due to rounding.

### Changed
- `refinanceLoan` server action now integrates with the new Credit Engine.
- `createLoan` server action now supports full plan generation and simulation.

---

## [1.1.0] - 2026-03-15
### Added
- Operational refinancing logic.
- Client and loan basic management.
- Initial UI for dashboard and loans.
