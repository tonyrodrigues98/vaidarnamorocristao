# Observability boundary

The first observable contract is the non-sensitive build identity exposed by
`vdn-build-commit` and `vdn-build-channel`.

Future telemetry must be domain-specific, bounded and free of secrets, message
content, profile text, direct contact data or payment identifiers. New events
must document purpose, fields, retention, sampling and rollback before use.

`release-telemetry.ts` supplies the provider-neutral launch-readiness contract:
an allowlisted event shape, route redaction, a 30-day maximum retention policy
and actionable severity levels. It does not transmit events or configure an
external vendor. Runtime wiring remains opt-in and must be approved together
with destination, data-processing agreement and retention controls.
