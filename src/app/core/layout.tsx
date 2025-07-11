export default function CoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Supply Chain Intelligence - Core</title>
        <meta name="description" content="Supply Chain Intelligence Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}