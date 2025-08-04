import React from "react";
import ClientProvider from "./ClientProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ClientProvider>{children}</ClientProvider>;
}