import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "reddit-insight-ai",
  eventKey: process.env.INNGEST_EVENT_KEY
});
