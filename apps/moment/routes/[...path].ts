import { defineHandler } from "void";
import app, { type Bindings } from "../worker";

const forwardToApp = defineHandler((c) => app.fetch(c.req.raw, c.env as Bindings, c.executionCtx));

export {
  forwardToApp as DELETE,
  forwardToApp as GET,
  forwardToApp as OPTIONS,
  forwardToApp as PATCH,
  forwardToApp as POST,
  forwardToApp as PUT,
};
