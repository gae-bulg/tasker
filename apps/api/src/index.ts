import { serve } from '@hono/node-server'
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono'
import { describeRoute, openAPISpecs } from 'hono-openapi';
import { resolver } from 'hono-openapi/zod';
import { logger } from 'hono/logger'

import z from "zod";

// For extending the Zod schema with OpenAPI properties
import "zod-openapi/extend";

const port = 3000


const querySchema = z
  .object({
    name: z.string().optional().openapi({ example: "Steven" }),
  })
  .openapi({ ref: "Query" });

const responseSchema = z.string().openapi({ example: "Hello Steven!" });

const healthCheckResponseSchema = z.object({
  ok: z.boolean(),
}).openapi({ example: { ok: true } });

const app = new Hono()

app.use(logger())

app.get(
  "/",
  describeRoute({
    description: "Say hello to the user",
    responses: {
      200: {
        description: "Successful greeting response",
        content: {
          "text/plain": {
            schema: resolver(responseSchema),
          },
        },
      },
    },
  }),
  zValidator("query", querySchema),
  (c) => {
    const query = c.req.valid("query");
    return c.text(`Hello ${query?.name ?? "Hono"}!`);
  }
);

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Tasker API",
        version: "1.0.0",
        description: "API for Tasker",
      },
      servers: [
        {
          url: `http://localhost:${port}`,
          description: "Local server",
        },
      ],
    },
  })
);

app.get('/health-check', (c) => {
  return c.json({
    ok: true,
  })
});

app.get(
  "/health-check",
  describeRoute({
    description: "Health check",
    responses: {
      200: {
        description: "Successful health check response",
        content: {
          "application/json": {
            schema: resolver(healthCheckResponseSchema),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json({
      ok: true,
    })
  }
);

console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
