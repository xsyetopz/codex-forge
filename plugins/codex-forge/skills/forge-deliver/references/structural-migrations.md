# Structural migration workflow

1. Record the behavior and public surfaces that remain stable, plus the intended dependency direction.
2. Map inbound and outbound dependencies and sequence shared contracts before dependents.
3. Keep mechanical movement attributable and migrate live consumers atomically.
4. Retain compatibility routes only for supported active contracts.
5. Search for the old structural forms after migration and validate the new dependency boundary.
