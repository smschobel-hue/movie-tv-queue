export const metadata = {

  title: "Movie & TV Queue",

  description: "Our shared movie and TV watch queue",

};

export default function RootLayout({ children }) {

  return (

    <html lang="en">

      <body>{children}</body>

    </html>

  );

}
