# Observability boundary

The first observable contract is the non-sensitive build identity exposed by
`vdn-build-commit` and `vdn-build-channel`.

Future telemetry must be domain-specific, bounded and free of secrets, message
content, profile text, direct contact data or payment identifiers. New events
must document purpose, fields, retention, sampling and rollback before use.
