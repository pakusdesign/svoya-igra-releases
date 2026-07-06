"use client";

import { FluentProvider, webDarkTheme } from "@fluentui/react-components";

export function FluentRoot({ children }: { children: React.ReactNode }) {
  return (
    <FluentProvider theme={webDarkTheme}>
      {children}
    </FluentProvider>
  );
}
