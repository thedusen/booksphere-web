import Link from 'next/link';

export default function Test() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Test Link Page</h1>
      <Link href="/inventory/123">Test Link to Inventory 123</Link>
    </div>
  );
} 