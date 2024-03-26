import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  // Here, you can perform server-side operations as needed
  
  render() {
    return (
      <Html>
        <Head>
          {/* You can include your site's metadata and other <head> tags here */}
        </Head>
        <body>
          <Main /> {/* This is where the Next.js application is rendered */}
          <NextScript /> {/* Next.js's essential JavaScript: Do not remove this */}
          {/* Here's where you might inject a script to define the global hook if it doesn't exist */}
         
        </body>
      </Html>
    )
  }
}

export default MyDocument