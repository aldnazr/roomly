import { z } from "zod";

const roomCreateSchema = z.object({ roomName: z.string() });
