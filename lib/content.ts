export type Fav = { title: string; by: string; why: string };

/*
  Yahan apna asli content bharo. Khali chhodoge to site honest placeholder dikhayegi.
  Example format:
    books: [{ title: "Book name", by: "Author", why: "Ek line: ye tumhare liye kyun matter karti hai" }],
*/
export const CONTENT = {
  quote: { text: "", who: "" }, // e.g. { text: "Krato found a bug I missed for weeks.", who: "Name, what they build" }
  books: [] as Fav[],
  songs: [] as Fav[],
  nowReading: "",
  nowListening: "",
  boxing: "", // e.g. "Boxing since 2024. It taught me to keep showing up on bad days."
  failure: { title: "", story: "" }, // ek project jo nahi chala aur kyun
  goals: [
    "Get Krato's first paying user",
    "Finish Journey Discovery: detect real user flows and walk through them",
    "Keep talking to real users",
  ],
};