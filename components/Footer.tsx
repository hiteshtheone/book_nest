export function Footer({ fileDatabase }: { fileDatabase: boolean }) {
  return (
    <footer className="wrap footnote">
      <p>Jade Book Nest · Reading Challenge 2026 · 1 Nov – 31 Dec</p>
      {fileDatabase ? <p>This local run is using a file database because DATABASE_URL is not set.</p> : null}
    </footer>
  );
}
