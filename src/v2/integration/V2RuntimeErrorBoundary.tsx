import { Component, type ErrorInfo, type ReactNode } from "react";
import { V2RuntimeState } from "./V2RuntimeState";

export class V2RuntimeErrorBoundary extends Component<
  { readonly children: ReactNode },
  { readonly failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: true } {
    return { failed: true };
  }

  componentDidCatch(_error: unknown, _info: ErrorInfo): void {
    // Intentionally sanitized: no session, profile or internal error reaches logs or the UI.
  }

  render() {
    if (this.state.failed) {
      return (
        <V2RuntimeState kind="runtime-error" onRetry={() => this.setState({ failed: false })} />
      );
    }
    return this.props.children;
  }
}
