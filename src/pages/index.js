import Head from "next/head";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with R3F
const ShoeGrid = dynamic(() => import("@/components/grid/ShoeGrid"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Vrindopnishad | Divine Art Gallery</title>
        <meta name="description" content="Explore an immersive 3D gallery of sacred spiritual masterpieces from Braj and beyond." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ShoeGrid />
    </>
  );
}
