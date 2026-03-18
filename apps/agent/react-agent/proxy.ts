import { Hono } from "hono";

const app = new Hono();

app.get("/custom-route", (c) => {
  return c.json({ message: "This is a custom route!" });
});

export { app };
