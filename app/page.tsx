import RoomLoader from "@/components/RoomLoader";

export default function Home() {
  return (
    <>
      <RoomLoader />
      <div className="sr-only">
        <h1>Vishesh Meena</h1>
        <p>
          Self-taught solo founder from Sawai Madhopur, Rajasthan, India.
          Building Krato, an AI QA tool for solo developers. 8 products shipped
          in about 14 months, 2 hackathons won.
        </p>
        <a href="/plain">Plain text version of this site</a>
        <a href="/resume">Resume</a>
        <a href="https://kratoai.vercel.app">Krato</a>
      </div>
    </>
  );
}