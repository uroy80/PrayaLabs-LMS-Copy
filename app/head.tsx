export default function Head() {
  return (
    <>
      <title>Library Management System</title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="description" content="Institutional Library Management Portal" />

      {/* Favicon with cache busting */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico?v=3" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=3" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=3" />
      <link rel="shortcut icon" href="/favicon.ico?v=3" />

      {/* PWA Manifest */}
      <link rel="manifest" href="/manifest.json?v=3" />
      <meta name="theme-color" content="#1e3a8a" />

      {/* Apple PWA Meta Tags */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Library System" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />

      {/* Microsoft PWA Meta Tags */}
      <meta name="msapplication-TileColor" content="#1e3a8a" />
      <meta name="msapplication-TileImage" content="/favicon-32.png?v=3" />
    </>
  )
}
